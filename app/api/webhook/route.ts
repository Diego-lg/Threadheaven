import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      console.error("Unexpected webhook error type:", error);
    }
    console.log("Webhook Error:", errorMessage);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  interface OrderItemType {
    productId: string;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  console.log("Processing webhook event type:", event.type);
  console.log("Session metadata:", session?.metadata);

  const address = session?.customer_details?.address;

  const addressComponents = [
    address?.line1,
    address?.line2,
    address?.city,
    address?.state,
    address?.postal_code,
    address?.country,
  ];

  const addressString = addressComponents.filter((c) => c !== null).join(", ");

  if (event.type === "checkout.session.completed") {
    const orderId = session?.metadata?.orderId;
    console.log("Attempting to update order with ID:", orderId);

    try {
      const order = await prismadb.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          address: addressString,
          phone: session?.customer_details?.phone || "",
        },
        include: {
          orderItems: true,
        },
      });

      console.log("Order updated successfully:", order.id);

      if (!order.orderItems || order.orderItems.length === 0) {
        console.log("Warning: No order items found for this order");
      }

      const productIds = order.orderItems.map(
        (orderItem: OrderItemType) => orderItem.productId
      );

      console.log("Product IDs to archive:", productIds);

      if (productIds.length > 0) {
        await prismadb.product.updateMany({
          where: {
            id: {
              in: [...productIds],
            },
          },
          data: {
            isArchived: true,
          },
        });
        console.log("Products archived successfully");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      return new NextResponse("Error processing payment", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}

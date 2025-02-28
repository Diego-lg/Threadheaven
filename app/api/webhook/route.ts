import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

export const config = {
  api: {
    bodyParser: false, // Required for raw body parsing
  },
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing Stripe Signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  console.log("Webhook event received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Processing order:", session?.metadata?.orderId);

    try {
      const order = await prismadb.order.update({
        where: { id: session?.metadata?.orderId },
        data: { isPaid: true },
        include: { orderItems: true },
      });

      console.log("Order updated successfully:", order.id);
      return new NextResponse("Success", { status: 200 });
    } catch (error) {
      console.error("Database error:", error);
      return new NextResponse("Database error", { status: 500 });
    }
  }

  return new NextResponse("Event ignored", { status: 200 });
}

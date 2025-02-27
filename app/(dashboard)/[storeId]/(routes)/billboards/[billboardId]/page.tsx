import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";

// Use the proper Next.js typing for page params
interface PageProps {
  params: {
    billboardId: string;
    storeId: string;
  };
}

const BillboardPage = async ({ params }: PageProps) => {
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId,
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;

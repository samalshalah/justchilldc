import { getAllOrders } from "@/lib/data";
import { OrdersTable } from "./OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Orders</h1>
      <p className="text-zinc-400 mb-6">
        {orders.length} total · click an order to view items and update status
      </p>
      <OrdersTable orders={orders} />
    </div>
  );
}

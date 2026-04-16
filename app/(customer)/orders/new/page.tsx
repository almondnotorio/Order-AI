import { OrderForm } from "@/components/orders/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Describe your signage order in plain language — our AI will extract the details.
        </p>
      </div>
      <OrderForm />
    </div>
  );
}

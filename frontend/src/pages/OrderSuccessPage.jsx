import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { getOrderById } from "../api/orders";
import { formatPrice } from "../utils/format";

const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    getOrderById(id).then(({ data }) => setOrder(data.order)).catch(() => {});
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle size={56} className="mx-auto mb-6 text-green-500" strokeWidth={1.5} />
      <h1 className="font-display text-4xl">Order Placed!</h1>
      <p className="mt-3 text-charcoal/60">Thank you for shopping at Felt &amp; Form.</p>
      {order && (
        <div className="mt-8 border border-ink/10 p-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Order number</span>
            <span className="font-medium">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Total</span>
            <span className="font-medium">{formatPrice(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Payment</span>
            <span>{order.payment_method?.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Shipping to</span>
            <span>{order.shipping_city}, {order.shipping_country}</span>
          </div>
        </div>
      )}
      <div className="mt-8 flex justify-center gap-4">
        <Link to="/profile/orders" className="btn-outline">My Orders</Link>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

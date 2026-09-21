import { Link } from "react-router-dom";
import useSEO from "../utils/useSEO";

const AboutPage = () => {
  useSEO({
    title: "Our Story",
    description: "Learn how Dora Donuts started in Cairo and why we make donuts that are fresh and delicious.",
  });

  return (
    <div>
      <section className="bg-ink text-paper py-24 px-4 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-6 border border-dashed border-paper/15" />
        <p className="eyebrow text-paper/50 mb-3">Est. 2020 — Cairo, Egypt</p>
        <h1 className="font-display text-5xl sm:text-7xl">Our Story</h1>
        <div className="stitch-rule mx-auto mt-5 w-20 text-paper/30" />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 space-y-10">
        {[
          {
            eyebrow: "The idea",
            title: "Made to Make You Smile",
            body: "Dora Donuts started with a simple idea: donuts should be more than just a quick treat. They should be fresh, delicious, and something you look forward to. We make every donut with care, bringing together great flavors, soft dough, and a little bit of fun in every bite.",
          },
          {
            eyebrow: "The craft",
            title: "Freshness in Every Bite",
            body: "We believe the best donuts start with the basics. Our dough is carefully prepared, our toppings are chosen for flavor, and every donut is made to be enjoyed fresh. From classic favorites to exciting new flavors, we pay attention to the little details that make a big difference.",
          },
          {
            eyebrow: "The future",
            title: "Always Something Sweet",
            body: "We're not here to make donuts boring. We're constantly exploring new flavors, combinations, and ideas while keeping the favorites you already love. Whether you're grabbing a box for yourself, sharing with friends, or celebrating something special, Dora Donuts is here to make the moment a little sweeter.",
          },
        ].map(({ eyebrow, title, body }) => (
          <div key={title} className="space-y-3">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="font-display text-3xl">{title}</h2>
            <div className="stitch-rule w-16 text-ink/30" />
            <p className="text-charcoal/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <section className="bg-cream py-16 text-center px-4">
        <p className="eyebrow mb-3">Ready to explore?</p>
        <h2 className="font-display text-4xl mb-6">Shop the Collection</h2>
        <Link to="/shop" className="btn-primary inline-flex">Shop Now</Link>
      </section>
    </div>
  );
};

export default AboutPage;

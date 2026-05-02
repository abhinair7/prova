import Link from "next/link";
import { FlaskConical, Github, Twitter, Linkedin } from "lucide-react";

const links = {
  Product: ["Benchmark", "Evaluate", "Agents", "API"],
  Verticals: ["Healthcare", "Legal", "Finance", "Engineering", "Accounting"],
  Company: ["About", "Blog", "Methodology", "Careers"],
  Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-[rgba(255,255,255,0.06)] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center">
                <FlaskConical className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold">prova</span>
              <span className="text-[#7C3AED] font-semibold">.ai</span>
            </Link>
            <p className="text-xs text-[#475569] leading-relaxed max-w-xs mb-6">
              The trust and discovery layer for professional AI. Verified domain
              experts. Real tasks. Rankings that mean something.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#475569] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                {category}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-xs text-[#475569] hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#2D3748]">
            © 2026 Prova AI Inc. All rights reserved.
          </p>
          <p className="text-xs text-[#2D3748] italic">
            "Prova it. Prove it."
          </p>
        </div>
      </div>
    </footer>
  );
}

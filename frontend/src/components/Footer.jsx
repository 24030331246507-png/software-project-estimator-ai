import React from "react";
import { Facebook, Instagram, MessageCircle, Send, Twitter } from "lucide-react";

const socialLinks = [
  { label: "Telegram", href: "https://t.me/", icon: Send },
  { label: "Twitter", href: "https://twitter.com/", icon: Twitter },
  { label: "Instagram", href: "https://instagram.com/", icon: Instagram },
  { label: "WhatsApp", href: "https://wa.me/", icon: MessageCircle },
  { label: "Facebook", href: "https://facebook.com/", icon: Facebook },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <strong>Cost & Time Project Analysis</strong>
        <span>Website created by Gaikwad Vaishnavi</span>
      </div>
      <div className="footer-socials" aria-label="Social media links">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
            <Icon size={18} />
          </a>
        ))}
      </div>
    </footer>
  );
}

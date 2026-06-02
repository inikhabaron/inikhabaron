'use client';
import React from 'react';
import Image from 'next/image';
import { Mail } from "lucide-react";
import { getCatLabel } from '@/lib/news-utils';
import {
  FaFacebookF,
  FaXTwitter,
  FaYoutube,
  FaInstagram
} from 'react-icons/fa6';

const hiTranslations = {
  nation: 'देश',
  states: 'प्रदेश',
  politics: 'राजनीति',
  world: 'दुनिया',
  economy: 'अर्थव्यवस्था',
  sports: 'खेल',
  entertainment: 'मनोरंजन',
  opinion: 'विमर्श',
  schemes: 'योजनाएं',
  education: 'पढ़ाई',
  jobs: 'नौकरी',
  farmers: 'किसान',
  science: 'विज्ञान',
  innovation: 'छलांग',
  'auto-gadget': 'ऑटोमोबाइल-गैजेट',
  literature: 'साहित्य',
  spirituality: 'आध्यात्म',
  lifestyle: 'लोकरुचि',
  local: 'स्थानीय',
 };

export default function SiteFooter({ dark, categories, selectedLanguage, onCategoryClick, newsletterEmail, setNewsletterEmail, onNewsletterSubscribe, newsletterLoading }) {
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';

  const aboutLinks  = selectedLanguage === 'hi' ? ['हमारे बारे में', 'संपादकीय नीति', 'विज्ञापन दें', 'गोपनीयता नीति', 'सम्पर्क करें'] : ['About Us', 'Editorial Policy', 'Advertise', 'Privacy Policy', 'Contact Us'];
  const usefulLinks = selectedLanguage === 'hi' ? ['ई-पेपर', 'लाइव टीवी', 'फोटो गैलरी', 'वीडियो', 'साइट मैप'] : ['E-Paper', 'LIVE TV', 'Photo Gallery', 'Videos', 'Site Map'];

  return (
    <footer style={{ backgroundColor: dark ? '#0d1117' : '#ffffff', borderTop: `1px solid ${dark ? '#252E40' : '#E8EAED'}` }}>
      {/* Newsletter */}
      <div className="kn-footer-newsletter">
        <div className="kn-footer-nl-inner">
          <div className="kn-footer-nl-text">
            <div className="kn-footer-nl-icon">
              <Mail size={48} strokeWidth={2.2} />
            </div>
            <div>
              <p className="kn-footer-nl-heading">{selectedLanguage === 'hi' ? 'लेटेस्ट खबरों के लिए हमारे न्यूज़लेटर को सब्सक्राइब करें' : 'Subscribe to our newsletter for the latest news'}</p>
              <p className="kn-footer-nl-sub">{selectedLanguage === 'hi' ? 'हर बड़ी खबर सीधे आपके ईमेल पर' : 'Get top stories delivered to your inbox'}</p>
            </div>
          </div>
          <div className="kn-footer-nl-form">
            <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder={selectedLanguage === 'hi' ? 'अपना ईमेल पता दर्ज करें' : 'Enter your email address'} className="kn-footer-nl-input" />
            <button onClick={onNewsletterSubscribe} disabled={newsletterLoading} className="kn-footer-nl-btn">
              {newsletterLoading ? (selectedLanguage === 'hi' ? 'लोड हो रहा...' : 'Loading...') : (selectedLanguage === 'hi' ? 'सब्सक्राइब करें' : 'Subscribe')}
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="kn-footer-main">
        <div className="kn-footer-main-inner">
          {/* Brand */}
          <div className="kn-footer-brand">
            <div className="kn-footer-logo-row">
              <Image src="/Parent-footer.jpeg" alt="INI" width={60} height={60} style={{ borderRadius: '0' }} />
              <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex' }}>
                <Image src="/Parent-name.jpeg" alt="Integral News of India" width={220} height={72} style={{ objectFit: 'contain' }} />
              </div>
            </div>
            <p className="kn-footer-desc" style={{ color: T2 }}>
              {selectedLanguage === 'hi' ? 'खबरON भारत का प्रमुख न्यूज प्लेटफार्म है जो देश-दुनिया की हर खबर आप तक पहुँचाता है।' : "KhabarON is India's leading news platform."}
            </p>
            
            <div className="kn-footer-social-row" style={{ color: dark ? 'rgb(255, 255, 255)' : 'rgb(1, 1, 1)' }}>
              <button className="kn-footer-social-btn">
                <FaFacebookF size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaXTwitter size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaYoutube size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaInstagram size={14} />
              </button>
            </div>
          </div>

          {/* About */}
          <div className="kn-footer-links-col">
            <h4 className="kn-footer-col-title" style={{ color: T1 }}>{selectedLanguage === 'hi' ? 'हमारे बारे में' : 'About'}</h4>
            <ul className="kn-footer-link-list">
              {aboutLinks.map(link => <li key={link}><button className="kn-footer-link-btn" style={{ color: T2 }}>{link}</button></li>)}
            </ul>
          </div>

          {/* Useful links */}
          <div className="kn-footer-links-col">
            <h4 className="kn-footer-col-title" style={{ color: T1 }}>{selectedLanguage === 'hi' ? 'उपयोगी लिंक' : 'Useful Links'}</h4>
            <ul className="kn-footer-link-list">
              {usefulLinks.map(link => <li key={link}><button className="kn-footer-link-btn" style={{ color: T2 }}>{link}</button></li>)}
            </ul>
          </div>

          {/* Categories */}
          <div className="kn-footer-links-col">
            <h4 className="kn-footer-col-title" style={{ color: T1 }}>{selectedLanguage === 'hi' ? 'श्रेणियाँ' : 'Categories'}</h4>
            <ul className="kn-footer-link-list">
              {[
                { slug: 'nation', name: 'देश' },
                { slug: 'states', name: 'प्रदेश' },
                { slug: 'politics', name: 'राजनीति' },
                { slug: 'world', name: 'दुनिया' },
                { slug: 'science', name: 'विज्ञान' },
                { slug: 'schemes', name: 'योजनाएं' }
              ].map(cat => (
                <li key={cat.slug}>
                  <button
                    className="kn-footer-link-btn"
                    style={{ color: T2 }}
                    onClick={() => onCategoryClick(cat.slug)}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="kn-footer-links-col">
            <h4 className="kn-footer-col-title" style={{ color: T1 }}>{selectedLanguage === 'hi' ? 'संपर्क' : 'Contact'}</h4>
            <ul className="kn-footer-contact-list">
              <li style={{ color: T2 }}>✉ info@khabaron.in</li>
              <li style={{ color: T2 }}>📞 +91 12345 67890</li>
              <li style={{ color: T2 }}>📍 A-23, Sector 62, नोएडा</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="kn-footer-copyright" style={{ borderTopColor: dark ? '#252E40' : '#E8EAED' }}>
        <p style={{ color: T3 }}>© 2026 खबरON. {selectedLanguage === 'hi' ? 'सभी अधिकार सुरक्षित।' : 'All rights reserved.'}</p>
      </div>
    </footer>
  );
}


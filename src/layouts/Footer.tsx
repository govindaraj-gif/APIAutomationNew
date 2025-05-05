import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <footer className=".border-gray-200  text-gray-800  py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <h2 className="text-xl font-semibold mb-3">MyApp</h2>
            <p className="text-sm">Empowering your workflow, one tool at a time.</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-md font-semibold mb-2">Company</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:underline">About Us</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Support</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-md font-semibold mb-2">Follow Us</h3>
            <div className="flex space-x-4 mt-2">
              <a href="#" className="hover:text-white"><FaFacebookF /></a>
              <a href="#" className="hover:text-white"><FaTwitter /></a>
              <a href="#" className="hover:text-white"><FaInstagram /></a>
              <a href="#" className="hover:text-white"><FaLinkedinIn /></a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-4 border-t border-gray-700 pt-4 text-sm text-center">
          © {new Date().getFullYear()} MyApp. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

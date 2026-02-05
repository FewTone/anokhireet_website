import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-[#f8eee6] border-t border-[#e6d0c0] py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center space-y-8">

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-800 hover:text-black transition-colors font-medium">
                        <Link href="/about" className="hover:text-gray-600">About Us</Link>
                        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-gray-600">Terms & Conditions</Link>
                        <Link href="/contact" className="hover:text-gray-600">Contact Us</Link>
                    </nav>

                    {/* Social Links */}
                    <div className="flex items-center space-x-6">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="sr-only">Facebook</span>
                            <div className="relative h-5 w-5">
                                <Image
                                    src="/footer/fi_1051309.png"
                                    alt="Facebook"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="sr-only">Instagram</span>
                            <div className="relative h-5 w-5">
                                <Image
                                    src="/footer/fi_1384031.png"
                                    alt="Instagram"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="sr-only">YouTube</span>
                            <div className="relative h-5 w-5">
                                <Image
                                    src="/footer/fi_1384028.png"
                                    alt="YouTube"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </a>
                        <a href="https://wa.me/918200647176" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="sr-only">WhatsApp</span>
                            <div className="relative h-5 w-5">
                                <Image
                                    src="/footer/fi_733641.png"
                                    alt="WhatsApp"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </a>
                    </div>

                    {/* Copyright */}
                    <div className="text-center text-xs text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Anokhi Reet. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

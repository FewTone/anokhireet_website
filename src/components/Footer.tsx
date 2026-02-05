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
                                    src="/footer/fi_1051309.svg"
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
                                    src="/footer/fi_1384031.svg"
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
                                    src="/footer/fi_1384028.svg"
                                    alt="YouTube"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </a>
                        <a href="https://wa.me/918200647176" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="sr-only">WhatsApp</span>
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <g clipPath="url(#clip0_whatsapp)">
                                    <path
                                        d="M50.0125 0H49.9875C22.4188 0 0 22.425 0 50C0 60.9375 3.525 71.075 9.51875 79.3063L3.2875 97.8813L22.5063 91.7375C30.4125 96.975 39.8437 100 50.0125 100C77.5812 100 100 77.5687 100 50C100 22.4313 77.5812 0 50.0125 0ZM79.1062 70.6062C77.9 74.0125 73.1125 76.8375 69.2937 77.6625C66.6812 78.2187 63.2687 78.6625 51.7812 73.9C37.0875 67.8125 27.625 52.8812 26.8875 51.9125C26.1813 50.9437 20.95 44.0063 20.95 36.8313C20.95 29.6563 24.5938 26.1625 26.0625 24.6625C27.2688 23.4313 29.2625 22.8687 31.175 22.8687C31.7937 22.8687 32.35 22.9 32.85 22.925C34.3188 22.9875 35.0562 23.075 36.025 25.3938C37.2312 28.3 40.1687 35.475 40.5187 36.2125C40.875 36.95 41.2313 37.95 40.7313 38.9188C40.2625 39.9188 39.85 40.3625 39.1125 41.2125C38.375 42.0625 37.675 42.7125 36.9375 43.625C36.2625 44.4188 35.5 45.2688 36.35 46.7375C37.2 48.175 40.1375 52.9687 44.4625 56.8187C50.0437 61.7875 54.5687 63.375 56.1875 64.05C57.3937 64.55 58.8312 64.4313 59.7125 63.4938C60.8312 62.2875 62.2125 60.2875 63.6187 58.3188C64.6187 56.9063 65.8813 56.7312 67.2063 57.2312C68.5563 57.7 75.7 61.2312 77.1688 61.9625C78.6375 62.7 79.6062 63.05 79.9625 63.6688C80.3125 64.2875 80.3125 67.1937 79.1062 70.6062Z"
                                        fill="#3C3937"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_whatsapp">
                                        <rect width="100" height="100" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
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

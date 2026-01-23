"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export default function PrivacyPolicy() {
    return (
        <>
            <Navbar />
            <main className={`min-h-screen bg-white text-black ${inter.className} relative`}>
                <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                    <div className="space-y-12">
                        {/* Header Section */}
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black uppercase">
                                Privacy Policy
                            </h1>
                            <p className="text-gray-500 font-semibold tracking-wide uppercase text-xs">
                                Anokhi Reet | Last updated: January 23, 2026
                            </p>
                        </div>

                        <div className="max-w-none space-y-10 text-gray-800 leading-relaxed">
                            <p className="text-sm md:text-base text-gray-900 border-l-2 border-black pl-4 py-1">
                                At Anokhi Reet, we deeply value trust, dignity, and respect — especially when it comes to personal information. This Privacy Policy explains how we collect, use, protect, and handle your information when you use our website, platform, or services.
                                <br /><br />
                                By accessing or using Anokhi Reet, you agree to the practices described in this Privacy Policy.
                            </p>

                            {/* Section I */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    I. Our Commitment to Privacy
                                </h2>
                                <p className="text-sm md:text-base">
                                    Anokhi Reet is built as a women-empowerment platform that enables community-based sharing of traditional clothing. We believe privacy is not just a legal requirement, but a responsibility.
                                    We collect only what is necessary to operate the platform effectively and respectfully.
                                </p>
                            </section>

                            {/* Section II */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    II. Information We Collect
                                </h2>
                                <div className="space-y-6 text-sm md:text-base">
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">1. Personal Information</h3>
                                        <p className="mb-2">When you create an account or use our platform, we may collect the following personal information:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                            <li>Full name</li>
                                            <li>Email address</li>
                                            <li>Phone number</li>
                                            <li>City or location</li>
                                            <li>Profile photo (optional)</li>
                                        </ul>
                                        <p className="mt-2 italic text-gray-500 text-xs text-xs">This information helps us identify users, enable communication, and maintain platform integrity.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">2. Seller / Owner Information</h3>
                                        <p className="mb-2">For users who list products on Anokhi Reet, we may additionally collect:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                            <li>Contact number (including WhatsApp, if provided)</li>
                                        </ul>
                                        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-none">
                                            <p className="font-bold text-black mb-1 uppercase text-[10px] tracking-[0.2em]">We do not collect:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
                                                <li>Bank details</li>
                                                <li>Payment credentials</li>
                                                <li>Government identification documents</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">3. Product & Listing Information</h3>
                                        <p className="mb-2">When you list a product, we collect information such as:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                            <li>Product images and videos</li>
                                            <li>Descriptions and details of clothing</li>
                                            <li>Availability status</li>
                                        </ul>
                                        <p className="mt-2 italic text-gray-500 text-xs">This information is displayed publicly on the platform.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">4. Communication Data</h3>
                                        <p>
                                            Anokhi Reet provides an internal chat system to allow communication between users.
                                            Messages exchanged through the platform may be stored for operational, safety, and support purposes.
                                            We do not actively monitor conversations unless required for dispute handling, misuse prevention, or legal compliance.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section III */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    III. What We Do Not Collect
                                </h2>
                                <p className="mb-2 text-sm md:text-base">To be very clear:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>We do not collect or store payment details</li>
                                    <li>We do not process transactions</li>
                                    <li>We do not store banking, card, or UPI information</li>
                                </ul>
                                <p className="mt-4 font-bold text-black uppercase text-xs tracking-wider">All financial arrangements happen directly between users.</p>
                            </section>

                            {/* Section IV */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    IV. How We Use Your Information
                                </h2>
                                <p className="mb-2 text-sm md:text-base">We use collected information to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>Create and manage user accounts</li>
                                    <li>Enable product listings and visibility</li>
                                    <li>Facilitate communication between users</li>
                                    <li>Review and approve listings</li>
                                    <li>Improve platform experience and performance</li>
                                    <li>Promote selected products or listings (with consent implied through platform use)</li>
                                    <li>Maintain safety, prevent misuse, and enforce platform policies</li>
                                </ul>
                            </section>

                            {/* Section V */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    V. Social Media & Promotional Use
                                </h2>
                                <p className="mb-2 text-sm md:text-base">By listing a product on Anokhi Reet, you grant us permission to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>Display your product images on our website</li>
                                    <li>Feature selected products on Instagram and Facebook</li>
                                    <li>Use images or videos in promotional or advertising content</li>
                                </ul>
                                <div className="mt-4 space-y-1 text-[10px] text-black uppercase tracking-widest leading-relaxed">
                                    <p>• Promotional use is selective and occasional</p>
                                    <p>• Not all listings are used for marketing</p>
                                    <p>• Content is used respectfully and aligned with brand values</p>
                                    <p>• We do not intentionally misuse personal identity images</p>
                                </div>
                            </section>

                            {/* Section VI */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VI. Cookies & Analytics
                                </h2>
                                <p className="text-sm md:text-base">
                                    Currently, Anokhi Reet may use basic cookies required for platform functionality such as login sessions.
                                    In the future, we may use analytics tools and advertising or social media tracking tools.
                                    <br /><br />
                                    These tools, if used, will help us understand platform usage and improve user experience. No personally sensitive data is knowingly sold or misused.
                                </p>
                            </section>

                            {/* Section VII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VII. Data Sharing & Disclosure
                                </h2>
                                <p className="mb-2 text-sm md:text-base">We do not sell, rent, or trade your personal information. Your data may be shared only:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>If required by law or legal authorities</li>
                                    <li>To protect the rights, safety, or integrity of Anokhi Reet or its users</li>
                                </ul>
                            </section>

                            {/* Section VIII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VIII. Data Security
                                </h2>
                                <p className="text-sm md:text-base">
                                    We take reasonable and appropriate steps to protect user data against unauthorized access, misuse, loss, or alteration.
                                    However, no digital platform can guarantee absolute security. Users are encouraged to maintain strong passwords and safeguard their account credentials.
                                </p>
                            </section>

                            {/* Section IX */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    IX. User Rights & Control
                                </h2>
                                <p className="mb-2 text-sm md:text-base">Users have the right to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>Request account deletion</li>
                                    <li>Request removal of personal data</li>
                                    <li>Update or correct account information</li>
                                </ul>
                            </section>

                            {/* Section X */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    X. Children & Age Considerations
                                </h2>
                                <p className="text-sm md:text-base">
                                    Anokhi Reet is intended for adult users. We do not knowingly collect personal information from minors. If such data is identified, it will be removed upon notice.
                                </p>
                            </section>

                            {/* Section XI */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XI. Platform Changes & Growth
                                </h2>
                                <p className="text-sm md:text-base">
                                    As Anokhi Reet grows, our systems, tools, and processes may evolve. Any changes affecting user privacy will be reflected in updates to this Privacy Policy.
                                </p>
                            </section>

                            {/* Section XII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XII. Legal Compliance
                                </h2>
                                <p className="text-sm md:text-base">
                                    This Privacy Policy is governed by the laws of India. Any matters related to privacy shall fall under Indian jurisdiction.
                                </p>
                            </section>

                            {/* Section XIII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XIII. Contact Information
                                </h2>
                                <div className="space-y-2 text-sm md:text-base text-gray-700">
                                    <p><span className="font-bold text-black uppercase text-xs tracking-wider mr-2">Brand:</span> Anokhi Reet</p>
                                    <p><span className="font-bold text-black uppercase text-xs tracking-wider mr-2">Email:</span> support@anokhireet.com</p>
                                </div>
                            </section>

                            {/* Closing Statement */}
                            <div className="pt-12 text-center border-t border-gray-100">
                                <p className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight">
                                    At Anokhi Reet, privacy is part of dignity.
                                </p>
                                <p className="mt-4 text-gray-500 max-w-2xl mx-auto italic text-sm">
                                    We honour the trust women place in us and commit to protecting it with care, responsibility, and respect.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}

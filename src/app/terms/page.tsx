"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export default function TermsAndConditions() {
    return (
        <>
            <Navbar />
            <main className={`min-h-screen bg-white text-black ${inter.className} relative`}>
                <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                    <div className="space-y-12">
                        {/* Header Section */}
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black uppercase">
                                Terms & Conditions
                            </h1>
                            <p className="text-gray-500 font-semibold tracking-wide uppercase text-xs">
                                Anokhi Reet | Last updated: January 23, 2026
                            </p>
                        </div>

                        <div className="max-w-none space-y-10 text-gray-800 leading-relaxed">
                            <p className="text-sm md:text-base text-gray-900 border-l-2 border-black pl-4 py-1">
                                Welcome to Anokhi Reet — a platform built with the belief that tradition can empower, and that women can create value from what they already own.
                                <br /><br />
                                By accessing, browsing, or using our website or services, you agree to be bound by the following Terms & Conditions. If you do not agree, we request you to discontinue use of the platform.
                            </p>

                            {/* Section I */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    I. Understanding Anokhi Reet
                                </h2>
                                <p className="text-sm md:text-base">
                                    Anokhi Reet is a digital platform designed to connect women who wish to rent out their traditional clothing with women who are looking to rent such clothing for personal use.
                                    <br /><br />
                                    Anokhi Reet functions solely as a facilitator of connections. The platform enables discovery, visibility, and communication between users but does not participate in the physical, financial, or logistical aspects of rentals.
                                </p>
                            </section>

                            {/* Section II */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    II. Scope of Our Role
                                </h2>
                                <div className="space-y-6 text-sm md:text-base">
                                    <p>To maintain clarity and trust, it is important to understand what Anokhi Reet does and does not do.</p>
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">Anokhi Reet:</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                            <li>Provides an online space to list and explore traditional clothing</li>
                                            <li>Enables communication between Owners and Renters</li>
                                            <li>Promotes selected listings through digital channels</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider">Anokhi Reet does not:</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                            <li>Inspect, verify, or certify clothing</li>
                                            <li>Take possession or custody of any product</li>
                                            <li>Manage delivery, pickup, or returns</li>
                                            <li>Act as a party to rental agreements</li>
                                            <li>Guarantee outcomes of any transaction</li>
                                        </ul>
                                    </div>
                                    <p className="italic text-gray-500 text-xs">All rental decisions and responsibilities remain with the users involved.</p>
                                </div>
                            </section>

                            {/* Section III */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    III. Eligibility & User Responsibility
                                </h2>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>Users must be at least 18 years of age.</li>
                                    <li>Users are responsible for providing accurate and current information.</li>
                                    <li>Each account is personal, and users are responsible for all activity under their account.</li>
                                    <li>Anokhi Reet reserves the right to limit or deny access if misuse is identified.</li>
                                </ul>
                            </section>

                            {/* Section IV */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    IV. Accounts, Listings & Platform Access
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Users who register on Anokhi Reet may:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Create and manage their own listings</li>
                                        <li>Edit or remove products</li>
                                        <li>Submit new products for review and approval</li>
                                    </ul>
                                    <p>All listings are subject to review to ensure alignment with the platform’s values and presentation standards. Approval is at the discretion of Anokhi Reet and may be withdrawn at any time.</p>
                                </div>
                            </section>

                            {/* Section V */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    V. Listing Fees
                                </h2>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 text-sm md:text-base">
                                    <li>Anokhi Reet may charge a fee for listing products on the platform.</li>
                                    <li>Listing fees relate solely to platform access and visibility.</li>
                                    <li>Payment of a listing fee does not imply endorsement, promotion, or rental success.</li>
                                    <li>Listing fees, once applied, are generally non-refundable.</li>
                                    <li>The structure, amount, or method of collecting such fees may evolve over time.</li>
                                </ul>
                            </section>

                            {/* Section VI */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VI. Rentals, Payments & Agreements
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>All rental arrangements are made directly between the Owner and the Renter. Users are encouraged to mutually agree upon:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Rental duration</li>
                                        <li>Pricing and payment method</li>
                                        <li>Security amount, if any</li>
                                        <li>Return conditions and timelines</li>
                                    </ul>
                                    <p className="font-bold text-black uppercase text-xs tracking-wider pt-2">Anokhi Reet does not handle payments, refunds, or financial disputes and does not intervene in rental negotiations.</p>
                                </div>
                            </section>

                            {/* Section VII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VII. Ownership, Condition & Hygiene
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Owners listing products confirm that:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>They have lawful ownership of the clothing</li>
                                        <li>The product is suitable for rental use</li>
                                        <li>Reasonable hygiene and cleanliness standards are maintained</li>
                                    </ul>
                                    <p>Anokhi Reet does not verify or audit product condition, quality, or authenticity. Renters are advised to seek clarity before finalizing any rental.</p>
                                </div>
                            </section>

                            {/* Section VIII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    VIII. Damage, Loss & Dispute Resolution
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Anokhi Reet is not responsible for:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Damage to products</li>
                                        <li>Loss or theft</li>
                                        <li>Delays or disagreements</li>
                                        <li>Misuse or dissatisfaction</li>
                                    </ul>
                                    <p>All disputes must be resolved directly between the involved users. While Anokhi Reet may offer guidance or communication support, it does not act as an arbitrator or guarantor.</p>
                                </div>
                            </section>

                            {/* Section IX */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    IX. Delivery, Exchange & Logistics
                                </h2>
                                <p className="text-sm md:text-base">
                                    The method of delivery, pickup, or return is entirely determined by the users involved.
                                    Anokhi Reet does not recommend or endorse any specific logistics method and bears no responsibility for related issues.
                                </p>
                            </section>

                            {/* Section X */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    X. Content & Promotional Rights
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>By listing a product, users grant Anokhi Reet permission to:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Display product images and descriptions on the website</li>
                                        <li>Use selected images or videos for promotional purposes</li>
                                        <li>Feature products on social media platforms such as Instagram and Facebook</li>
                                    </ul>
                                    <p className="italic text-gray-500 text-xs">Promotional use is selective and aligned with the brand’s aesthetic. Inclusion in promotional content is not guaranteed for every listing.</p>
                                </div>
                            </section>

                            {/* Section XI */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XI. Acceptable Use & Platform Conduct
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Users agree to engage respectfully and honestly. Prohibited actions include:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Providing false information</li>
                                        <li>Uploading inappropriate or offensive content</li>
                                        <li>Misusing the platform or brand identity</li>
                                        <li>Attempting to harm the platform’s integrity</li>
                                    </ul>
                                    <p>Violations may result in suspension or permanent removal.</p>
                                </div>
                            </section>

                            {/* Section XII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XII. Intellectual Property
                                </h2>
                                <p className="text-sm md:text-base">
                                    All branding, content, visuals, and platform materials belong to Anokhi Reet. Unauthorized reproduction or misuse is strictly prohibited.
                                </p>
                            </section>

                            {/* Section XIII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XIII. Limitation of Liability
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Anokhi Reet is not liable for:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Financial losses</li>
                                        <li>Emotional or personal harm</li>
                                        <li>User disputes</li>
                                        <li>Rental outcomes</li>
                                    </ul>
                                    <p className="italic text-gray-500 text-xs  pt-2">Use of the platform is entirely at the user’s discretion and risk.</p>
                                </div>
                            </section>

                            {/* Section XIV */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XIV. Vision & Values
                                </h2>
                                <div className="space-y-4 text-sm md:text-base">
                                    <p>Anokhi Reet exists to encourage:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                                        <li>Women-led economic independence</li>
                                        <li>Sustainable and mindful fashion</li>
                                        <li>Community-driven sharing</li>
                                    </ul>
                                    <p>While the platform supports empowerment, it does not guarantee income or success.</p>
                                </div>
                            </section>

                            {/* Section XV */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XV. Termination & Suspension
                                </h2>
                                <p className="text-sm md:text-base">
                                    Anokhi Reet reserves the right to restrict or terminate access without prior notice if terms are violated or misuse is suspected.
                                </p>
                            </section>

                            {/* Section XVI */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XVI. Updates to These Terms
                                </h2>
                                <p className="text-sm md:text-base">
                                    These Terms may be updated periodically. Continued use of the platform signifies acceptance of the updated Terms.
                                </p>
                            </section>

                            {/* Section XVII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XVII. Governing Law
                                </h2>
                                <p className="text-sm md:text-base">
                                    These Terms are governed by the laws of India, and any disputes shall fall under Indian jurisdiction.
                                </p>
                            </section>

                            {/* Section XVIII */}
                            <section className="space-y-4">
                                <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-normal border-b border-gray-100 pb-2">
                                    XVIII. Contact
                                </h2>
                                <div className="space-y-2 text-sm md:text-base text-gray-700">
                                    <p><span className="font-bold text-black uppercase text-xs tracking-wider mr-2">Brand:</span> Anokhi Reet</p>
                                    <p><span className="font-bold text-black uppercase text-xs tracking-wider mr-2">Email:</span> support@anokhireet.com</p>
                                </div>
                            </section>

                            {/* Closing Statement */}
                            <div className="pt-12 text-center border-t border-gray-100">
                                <p className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight">
                                    Anokhi Reet is not just a platform — it is a shared space of trust, tradition, and women supporting women.
                                </p>
                                <p className="mt-4 text-gray-500 max-w-2xl mx-auto italic text-sm">
                                    By being here, you become part of a larger purpose.
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

"use client";

import { formatUserDisplayName } from "@/lib/utils";
import Image from "next/image";

// Add custom styles for the date picker to match the theme
import "@/app/globals.css"; // Ensure global styles are available if they contain overrides

interface ProfileViewProps {
    userName: string;
    userPhone?: string;
    userEmail?: string;
    userLocation?: string;
    userGender?: string;
    userBirthdate?: string;
    userAvatar?: string;
    userState?: string;
    userCustomId?: string;
    userId?: string;
}

export default function ProfileView({
    userName,
    userPhone,
    userLocation,
    userGender,
    userBirthdate,
    userAvatar,
    userState,
    userCustomId,
}: ProfileViewProps) {
    const displayData = {
        location: userLocation || "Not provided",
        gender: userGender || "Not provided",
        birthdate: userBirthdate ? new Date(userBirthdate).toLocaleDateString('en-GB') : "Not provided",
        state: userState || "Not provided"
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center uppercase tracking-wide hidden md:block">Profile Details</h2>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white border border-gray-100 p-8 w-full min-h-[400px]">
                    <div className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex justify-center mb-6 relative">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 relative bg-gray-50 flex items-center justify-center">
                                    {userAvatar ? (
                                        <Image
                                            src={userAvatar}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-2xl font-semibold text-gray-400 uppercase">
                                            {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Custom ID Display - If exists */}
                        {userCustomId && (
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Your Unique User ID
                                </label>
                                <div className="text-black pt-1 pb-2 border-b border-gray-100">
                                    {userCustomId}
                                </div>
                            </div>
                        )}

                        {/* Read-only Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Full Name
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {formatUserDisplayName(userName)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Mobile Number
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {userPhone || "Not provided"}
                                </div>
                            </div>
                        </div>

                        {/* Display Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    State
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {displayData.state}
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    City / Location
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {displayData.location}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Gender
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {displayData.gender}
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Birthdate
                                </label>
                                <div className="w-full text-gray-900 border-b border-gray-100 pb-2 bg-transparent cursor-default">
                                    {displayData.birthdate}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

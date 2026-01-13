"use client";

import { useState, useEffect } from "react";
import { formatUserDisplayName } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ProfileViewProps {
    userName: string;
    userPhone?: string;
    userEmail?: string;
    userLocation?: string;
    userGender?: string;
    userBirthdate?: string;
    userId?: string;
    onUpdate?: () => void;
}

export default function ProfileView({
    userName,
    userPhone,
    userEmail,
    userLocation,
    userGender,
    userBirthdate,
    userId,
    onUpdate
}: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        location: userLocation || "",
        gender: userGender || "",
        birthdate: userBirthdate || ""
    });

    useEffect(() => {
        setFormData({
            location: userLocation || "",
            gender: userGender || "",
            birthdate: userBirthdate || ""
        });
    }, [userLocation, userGender, userBirthdate]);

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from("users")
                .update({
                    location: formData.location,
                    gender: formData.gender,
                    birthdate: formData.birthdate || null
                })
                .eq("id", userId);

            if (error) throw error;

            setIsEditing(false);
            if (onUpdate) onUpdate();
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">Profile Details</h2>

            <div className="bg-white border border-gray-100 rounded-lg p-8 max-w-xl">
                <div className="space-y-6">
                    {/* Read-only Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formatUserDisplayName(userName)}
                                disabled
                                className="w-full text-gray-500 bg-gray-50 border-b border-gray-100 pb-2 focus:outline-none cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                value={userPhone || "Not provided"}
                                disabled
                                className="w-full text-gray-500 bg-gray-50 border-b border-gray-100 pb-2 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Email Address
                        </label>
                        <input
                            type="text"
                            value={userEmail || "Not provided"}
                            disabled
                            className="w-full text-gray-500 bg-gray-50 border-b border-gray-100 pb-2 focus:outline-none cursor-not-allowed"
                        />
                    </div>

                    {/* Editable Fields */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Enter your city/location" : "Not provided"}
                            className={`w-full text-gray-900 border-b pb-2 focus:outline-none transition-colors ${isEditing ? "border-black bg-white" : "border-gray-100 bg-transparent"
                                }`}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Gender
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full text-gray-900 border-b border-black pb-2 focus:outline-none bg-white py-1"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-gray-900 border-b border-gray-100 pb-2 h-8 flex items-center">
                                    {formData.gender || "Not provided"}
                                </p>
                            )}
                        </div>

                        <div
                            onClick={() => {
                                if (isEditing) {
                                    const input = document.getElementById('birthdate-input') as HTMLInputElement;
                                    if (input && 'showPicker' in input) {
                                        input.showPicker();
                                    }
                                }
                            }}
                            className={isEditing ? "cursor-pointer" : ""}
                        >
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 pointer-events-none">
                                Birthdate
                            </label>
                            <input
                                id="birthdate-input"
                                type="date"
                                value={formData.birthdate}
                                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                disabled={!isEditing}
                                max={new Date().toISOString().split("T")[0]}
                                className={`w-full text-gray-900 border-b pb-2 focus:outline-none transition-colors h-9 ${isEditing ? "border-black bg-white" : "border-gray-100 bg-transparent"
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            location: userLocation || "",
                                            gender: userGender || "",
                                            birthdate: userBirthdate || ""
                                        });
                                    }}
                                    disabled={loading}
                                    className="px-8 py-3 bg-gray-200 text-gray-900 text-sm font-bold uppercase tracking-wide hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

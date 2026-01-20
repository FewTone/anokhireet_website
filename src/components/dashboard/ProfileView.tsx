"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatUserDisplayName } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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
    userAvatar,
    userId,
    onUpdate
}: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        location: userLocation || "",
        gender: userGender || "",
        birthdate: userBirthdate || ""
    });

    const [cities, setCities] = useState<any[]>([]);
    const [filteredCities, setFilteredCities] = useState<any[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    useEffect(() => {
        setFormData({
            location: userLocation || "",
            gender: userGender || "",
            birthdate: userBirthdate || ""
        });
    }, [userLocation, userGender, userBirthdate]);

    // Load cities
    useEffect(() => {
        const loadCities = async () => {
            const { data } = await supabase
                .from("cities")
                .select("*")
                .order("display_order", { ascending: true });

            if (data) {
                setCities(data);
            }
        };
        loadCities();
    }, []);

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, location: value });

        if (value.trim()) {
            const filtered = cities.filter(city =>
                city.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCities(filtered);
            setShowCitySuggestions(true);
        } else {
            setShowCitySuggestions(false);
        }
    };

    const selectCity = (cityName: string) => {
        setFormData({ ...formData, location: cityName });
        setShowCitySuggestions(false);
    };

    // Clear status message after 3 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0 || !userId) {
                return;
            }

            setUploadingAvatar(true);
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            if (onUpdate) onUpdate();
            setStatusMessage({ type: 'success', text: 'Profile picture updated!' });
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            setStatusMessage({ type: 'error', text: 'Error uploading image.' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);
        setStatusMessage(null);

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
            setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setStatusMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center uppercase tracking-wide hidden md:block">Profile Details</h2>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white border border-gray-100 rounded-lg p-8 w-full min-h-[400px]">
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

                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-1 text-xs rounded-full shadow-md hover:bg-gray-800 transition-colors z-10"
                                        title="Change Profile Picture"
                                    >
                                        {uploadingAvatar ? "Uploading..." : "Edit"}
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {/* Read-only Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formatUserDisplayName(userName)}
                                    disabled
                                    className="w-full text-gray-900 bg-transparent border-b border-gray-100 pb-2 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Mobile Number
                                </label>
                                <input
                                    type="text"
                                    value={userPhone || "Not provided"}
                                    disabled
                                    className="w-full text-gray-900 bg-transparent border-b border-gray-100 pb-2 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Email Field REMOVED */}

                        {/* Editable Fields */}
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={handleLocationChange}
                                onFocus={() => {
                                    if (isEditing && formData.location) {
                                        const filtered = cities.filter(city =>
                                            city.name.toLowerCase().includes(formData.location.toLowerCase())
                                        );
                                        setFilteredCities(filtered);
                                        setShowCitySuggestions(true);
                                    } else if (isEditing) {
                                        setFilteredCities(cities); // Show all if empty
                                        setShowCitySuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    // Delay hide to allow click
                                    setTimeout(() => setShowCitySuggestions(false), 200);
                                }}
                                disabled={!isEditing}
                                placeholder={isEditing ? "Enter your city/location" : "Not provided"}
                                className={`w-full text-gray-900 border-b pb-2 focus:outline-none transition-colors ${isEditing ? "border-black bg-white" : "border-gray-100 bg-transparent"
                                    }`}
                            />
                            {/* City Suggestions */}
                            {showCitySuggestions && isEditing && filteredCities.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded text-sm">
                                    {filteredCities.map((city) => (
                                        <li
                                            key={city.id}
                                            onClick={() => selectCity(city.name)}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                                        >
                                            {city.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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

                            <div className={isEditing ? "custom-datepicker-wrapper" : ""}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pointer-events-none">
                                    Birthdate
                                </label>
                                {isEditing ? (
                                    <DatePicker
                                        selected={formData.birthdate ? new Date(formData.birthdate) : null}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                const dateString = date.toLocaleDateString('en-CA');
                                                setFormData({ ...formData, birthdate: dateString });
                                            } else {
                                                setFormData({ ...formData, birthdate: "" });
                                            }
                                        }}
                                        maxDate={new Date()}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="dd/mm/yyyy"
                                        className="w-full text-gray-900 border-b border-black pb-2 focus:outline-none transition-colors h-9 bg-white cursor-pointer"
                                        onKeyDown={(e) => e.preventDefault()}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                    />
                                ) : (
                                    <p className="text-gray-900 border-b border-gray-100 pb-2 h-8 flex items-center">
                                        {formData.birthdate ? new Date(formData.birthdate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : "Not provided"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            <div className="flex gap-4">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-8 py-3 bg-black text-white text-sm font-semibold uppercase tracking-wide hover:bg-gray-800 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="px-8 py-3 bg-black text-white text-sm font-semibold uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                                                setStatusMessage(null);
                                            }}
                                            disabled={loading}
                                            className="px-8 py-3 bg-gray-200 text-gray-900 text-sm font-semibold uppercase tracking-wide hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                            {statusMessage && (
                                <div className={`text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {statusMessage.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

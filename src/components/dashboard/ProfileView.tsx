"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatUserDisplayName, generateCustomUserId, INDIAN_STATES } from "@/lib/utils";
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
    userState?: string;
    userCustomId?: string;
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
    userState,
    userCustomId,
    userId,
    onUpdate
}: ProfileViewProps) {
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        location: userLocation || "",
        gender: userGender || "",
        birthdate: userBirthdate || "",
        state: userState || ""
    });

    const [cities, setCities] = useState<any[]>([]);
    const [filteredCities, setFilteredCities] = useState<any[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [activeGenderIndex, setActiveGenderIndex] = useState(-1);
    const [showStateDropdown, setShowStateDropdown] = useState(false);

    const GENDER_OPTIONS = ['Male', 'Female', 'Other'];



    useEffect(() => {
        setFormData({
            location: userLocation || "",
            gender: userGender || "",
            birthdate: userBirthdate || "",
            state: userState || ""
        });
    }, [userLocation, userGender, userBirthdate, userState]);

    // Check if form data has changed from props
    const hasChanges = (
        (formData.location !== (userLocation || "")) ||
        (formData.gender !== (userGender || "")) ||
        (formData.birthdate !== (userBirthdate || "")) ||
        (formData.state !== (userState || ""))
    );

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

    // Auto-fill state if location matches a known city and state is empty
    useEffect(() => {
        if (!formData.location || formData.state) return;

        const matchingCity = cities.find(c => c.name.toLowerCase() === formData.location.toLowerCase());
        if (matchingCity && matchingCity.state) {
            setFormData(prev => ({ ...prev, state: matchingCity.state }));
        }
    }, [formData.location, formData.state, cities]);

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, location: value });
        setActiveSuggestionIndex(-1); // Reset selection on type

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showCitySuggestions || filteredCities.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestionIndex(prev =>
                prev < filteredCities.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredCities.length) {
                selectCity(filteredCities[activeSuggestionIndex].name);
            }
        } else if (e.key === "Escape") {
            setShowCitySuggestions(false);
        }
    };

    const handleGenderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showGenderDropdown) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setShowGenderDropdown(true);
                setActiveGenderIndex(0);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveGenderIndex(prev =>
                prev < GENDER_OPTIONS.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveGenderIndex(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeGenderIndex >= 0 && activeGenderIndex < GENDER_OPTIONS.length) {
                setFormData({ ...formData, gender: GENDER_OPTIONS[activeGenderIndex] });
                setShowGenderDropdown(false);
                setActiveGenderIndex(-1);
            }
        } else if (e.key === "Escape") {
            setShowGenderDropdown(false);
            setActiveGenderIndex(-1);
        }
    };

    const selectCity = (cityName: string) => {
        // Find city object to get state
        const cityObj = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());

        const updates: any = { location: cityName };

        // Auto-populate state if available from city and not already set (or overwrite? Let's overwrite to ensure consistency)
        // Only overwrite if state is available in city object
        if (cityObj && cityObj.state) {
            updates.state = cityObj.state;
        }

        setFormData(prev => ({ ...prev, ...updates }));
        setShowCitySuggestions(false);
        setActiveSuggestionIndex(-1);
    };

    const handleCancel = () => {
        setFormData({
            location: userLocation || "",
            gender: userGender || "",
            birthdate: userBirthdate || "",
            state: userState || ""
        });
        setStatusMessage(null);
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
            const updates: any = {
                location: formData.location,
                gender: formData.gender,
                birthdate: formData.birthdate || null,
                state: formData.state
            };

            // Generate Custom ID if not present
            if (!userCustomId) {
                if (!formData.state) {
                    setStatusMessage({ type: 'error', text: 'State is required to generate your ID.' });
                    setLoading(false);
                    return;
                }

                // Find state code
                const stateObj = INDIAN_STATES.find(s => s.name === formData.state);
                const stateCode = stateObj ? stateObj.code : formData.state.slice(0, 2).toUpperCase();

                // Generate unique custom ID
                let isUnique = false;
                let newCustomId = "";
                let attempts = 0;

                while (!isUnique && attempts < 5) {
                    newCustomId = generateCustomUserId(userName, stateCode);

                    // Check if exists
                    const { data: existing } = await supabase
                        .from("users")
                        .select("id")
                        .eq("custom_id", newCustomId)
                        .maybeSingle();

                    if (!existing) {
                        isUnique = true;
                    }
                    attempts++;
                }

                if (!isUnique) {
                    setStatusMessage({ type: 'error', text: 'Failed to generate unique ID. Please try again.' });
                    setLoading(false);
                    return;
                }

                updates.custom_id = newCustomId;
            }

            const { error } = await supabase
                .from("users")
                .update(updates)
                .eq("id", userId);

            if (error) throw error;

            if (onUpdate) onUpdate();
            setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setStatusMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const isValid = formData.location.trim().length > 0;

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

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute bottom-0 right-0 bg-black text-white px-3 py-1 text-xs rounded-full shadow-md hover:bg-gray-800 transition-colors z-10"
                                    title="Change Profile Picture"
                                >
                                    {uploadingAvatar ? "..." : "Edit"}
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {/* Custom ID Display - If exists */}
                        {userCustomId && (
                            <div className="bg-gray-50 p-4 border border-gray-200 rounded-none mb-2">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Your Unique User ID
                                </label>
                                <div className="text-xl font-bold font-mono tracking-wider text-black">
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

                        {/* Editable Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    State *
                                </label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    readOnly={!!userCustomId} // Lock state if ID generated? Maybe allow edit but warn? User requirement implies ID depends on state created in 2026. Custom ID is usually permanent. Let's lock it if ID exists.
                                    placeholder={userCustomId ? "" : "Select State"}
                                    onClick={() => !userCustomId && setShowStateDropdown(!showStateDropdown)}
                                    className={`w-full text-gray-900 border-b border-black pb-2 focus:outline-none bg-white ${!userCustomId ? "cursor-pointer" : "cursor-default text-gray-500 border-gray-200"}`}
                                />
                                {showStateDropdown && !userCustomId && (
                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg mt-1 rounded text-sm max-h-60 overflow-y-auto">
                                        {INDIAN_STATES.map((state) => (
                                            <li
                                                key={state.code}
                                                onClick={() => {
                                                    setFormData({ ...formData, state: state.name });
                                                    setShowStateDropdown(false);
                                                }}
                                                className="px-4 py-2 cursor-pointer text-gray-800 hover:bg-gray-100"
                                            >
                                                {state.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!userCustomId && (
                                    <p className="text-[10px] text-gray-400 mt-1">Required to generate your unique ID.</p>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    City / Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={handleLocationChange}
                                    onFocus={() => {
                                        if (formData.location) {
                                            const filtered = cities.filter(city =>
                                                city.name.toLowerCase().includes(formData.location.toLowerCase())
                                            );
                                            setFilteredCities(filtered);
                                            setShowCitySuggestions(true);
                                        } else {
                                            setFilteredCities(cities);
                                            setShowCitySuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowCitySuggestions(false), 200);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter your city"
                                    className="w-full text-gray-900 border-b border-black bg-white pb-2 focus:outline-none transition-colors"
                                />
                                {showCitySuggestions && filteredCities.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1 rounded text-sm">
                                        {filteredCities.map((city, index) => (
                                            <li
                                                key={city.id}
                                                onClick={() => selectCity(city.name)}
                                                className={`px-4 py-2 cursor-pointer text-gray-800 ${index === activeSuggestionIndex ? "bg-gray-100" : "hover:bg-gray-100"}`}
                                            >
                                                {city.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Gender
                                </label>
                                <input
                                    type="text"
                                    value={formData.gender}
                                    readOnly
                                    placeholder="Select Gender"
                                    onClick={() => {
                                        setShowGenderDropdown(!showGenderDropdown);
                                        setActiveGenderIndex(-1);
                                    }}
                                    onKeyDown={handleGenderKeyDown}
                                    // Use onBlur with delay to allow clicking items
                                    onBlur={() => setTimeout(() => {
                                        setShowGenderDropdown(false);
                                        setActiveGenderIndex(-1);
                                    }, 200)}
                                    className="w-full text-gray-900 border-b border-black pb-2 focus:outline-none bg-white cursor-pointer"
                                />
                                {showGenderDropdown && (
                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg mt-1 rounded text-sm">
                                        {GENDER_OPTIONS.map((option, index) => (
                                            <li
                                                key={option}
                                                onClick={() => {
                                                    setFormData({ ...formData, gender: option });
                                                    setShowGenderDropdown(false);
                                                    setActiveGenderIndex(-1);
                                                }}
                                                className={`px-4 py-2 cursor-pointer text-gray-800 ${index === activeGenderIndex ? "bg-gray-100" : "hover:bg-gray-100"}`}
                                            >
                                                {option}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="custom-datepicker-wrapper">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pointer-events-none">
                                    Birthdate
                                </label>
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
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            {hasChanges && (
                                <div className="flex gap-4 fade-in">
                                    <button
                                        onClick={handleCancel}
                                        className="px-8 py-3 bg-white text-black border border-black text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !isValid}
                                        className="px-8 py-3 bg-black text-white text-sm font-semibold uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            )}

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

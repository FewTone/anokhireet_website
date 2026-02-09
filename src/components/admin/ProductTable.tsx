"use client";

import { useState, useMemo } from 'react';

import Image from "next/image";
import { capitalizeFirstLetter } from "@/lib/utils";

export interface UserProduct {
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string;
    images?: string[];
    primary_image_index?: number;
    original_price?: number | string;
    product_id?: string;
    category?: any; // Facets object
    created_at: string;
    status?: string;
    listing_status?: string;
    is_active?: boolean;
    admin_note?: string;
}

interface ProductTableProps {
    products: UserProduct[];
    users?: any[];
    showOwner?: boolean;
    showFacets?: boolean;
    showStatus?: boolean;
    showPricing?: boolean;
    onUpdateListingStatus: (productId: string, newStatus: string) => void;
    onDelete: (product: UserProduct) => void;
    onEdit: (product: UserProduct) => void;
    onApprove?: (product: UserProduct) => void;
    onReject?: (product: UserProduct) => void;
    onToggleStatus?: (product: UserProduct) => void;
}

export default function ProductTable({
    products,
    users = [],
    showOwner = false,
    showFacets = true,
    showStatus = true,
    showPricing = true,
    onUpdateListingStatus,
    onDelete,
    onEdit,
    onApprove,
    onReject,
    onToggleStatus
}: ProductTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev: Record<string, string>) => ({ ...prev, [key]: value }));
    };

    const clearFilter = (key: string) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        setFilters(newFilters);
        setActiveFilterColumn(null);
    };

    const sortedAndFilteredProducts = useMemo(() => {
        let processedProducts = [...products];

        // Filtering
        if (Object.keys(filters).length > 0) {
            processedProducts = processedProducts.filter((product: UserProduct) => {
                return Object.entries(filters).every(([key, filterValue]) => {
                    if (!filterValue) return true;
                    const lowerFilter = filterValue.toLowerCase();

                    if (key === 'name') {
                        return product.name.toLowerCase().includes(lowerFilter) ||
                            (product.product_id && product.product_id.toLowerCase().includes(lowerFilter)) ||
                            product.id.toLowerCase().includes(lowerFilter);
                    }
                    if (key === 'owner' && showOwner) {
                        const owner = users.find(u => u.id === product.user_id);
                        return owner && (
                            owner.name.toLowerCase().includes(lowerFilter) ||
                            (owner.phone && owner.phone.includes(lowerFilter)) ||
                            (owner.email && owner.email.toLowerCase().includes(lowerFilter))
                        );
                    }
                    if (key === 'price') {
                        return product.price.toString().toLowerCase().includes(lowerFilter);
                    }
                    return true;
                });
            });
        }

        // Sorting
        if (sortConfig) {
            processedProducts.sort((a: UserProduct, b: UserProduct) => {
                const { key, direction } = sortConfig;
                let aValue: any = a[key as keyof UserProduct];
                let bValue: any = b[key as keyof UserProduct];

                if (key === 'owner') {
                    const ownerA = users.find(u => u.id === a.user_id)?.name || '';
                    const ownerB = users.find(u => u.id === b.user_id)?.name || '';
                    aValue = ownerA;
                    bValue = ownerB;
                } else if (key === 'created_at') {
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                } else if (key === 'price') {
                    // Try to parse price as number if possible, assuming it might be a string like "100" or "Rs. 100"
                    // But product.price is string in interface. Let's assume simple string compare or parseFloat if needed.
                    // For now string comparison for simplicity unless it's strictly numeric string.
                    const aNum = parseFloat(a.price.replace(/[^0-9.]/g, ''));
                    const bNum = parseFloat(b.price.replace(/[^0-9.]/g, ''));
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        aValue = aNum;
                        bValue = bNum;
                    }
                }

                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedProducts;
    }, [products, filters, sortConfig, users, showOwner]);

    // Helper to render filter dropdown
    const renderFilterDropdown = (columnKey: string, placeholder: string) => (
        activeFilterColumn === columnKey && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg z-50 p-3 min-w-[200px]" onClick={e => e.stopPropagation()}>
                <input
                    type="text"
                    value={filters[columnKey] || ''}
                    onChange={(e) => handleFilterChange(columnKey, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => clearFilter(columnKey)}
                        className="text-xs text-gray-600 hover:text-gray-900"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setActiveFilterColumn(null)}
                        className="text-xs text-blue-600 hover:text-blue-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    );

    // Helper for Sort/Filter Header
    const HeaderWithFilter = ({ label, sortKey, filterKey, placeholder }: { label: string, sortKey?: string, filterKey?: string, placeholder?: string }) => (
        <div className="flex items-center gap-2 relative group">
            {sortKey ? (
                <button
                    onClick={() => handleSort(sortKey)}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors uppercase"
                >
                    {label}
                    {sortConfig?.key === sortKey && (
                        <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 15l7-7 7 7" />
                        </svg>
                    )}
                </button>
            ) : (
                <span>{label}</span>
            )}

            {filterKey && placeholder && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveFilterColumn(activeFilterColumn === filterKey ? null : filterKey);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-none hover:bg-gray-200 ${filters[filterKey] ? 'opacity-100 text-blue-600' : ''}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                    {renderFilterDropdown(filterKey, placeholder)}
                </>
            )}
        </div>
    );

    return (
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <HeaderWithFilter label="Product Details" sortKey="name" filterKey="name" placeholder="Filter by name or ID..." />
                        </th>
                        {showOwner && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <HeaderWithFilter label="Owner" sortKey="owner" filterKey="owner" placeholder="Filter by owner..." />
                            </th>
                        )}
                        {showFacets && (
                            <>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Types</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Occasions</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Colors</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Materials</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cities</th>
                            </>
                        )}
                        {showPricing && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <HeaderWithFilter label="Pricing" sortKey="price" filterKey="price" placeholder="Filter by price..." />
                            </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Images</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <HeaderWithFilter label="Created" sortKey="created_at" />
                        </th>
                        {showStatus && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <HeaderWithFilter label="Status" sortKey="status" />
                            </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <HeaderWithFilter label="Listing Status" sortKey="listing_status" />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredProducts.map((product) => {
                        const owner = showOwner ? users.find(u => u.id === product.user_id) : null;

                        const primaryImage = product.images && Array.isArray(product.images) && product.images.length > 0
                            ? (product.primary_image_index !== undefined && product.primary_image_index >= 0 && product.primary_image_index < product.images.length
                                ? product.images[product.primary_image_index]
                                : product.images[0])
                            : product.image;

                        const imageCount = product.images && Array.isArray(product.images)
                            ? product.images.length
                            : (product.image ? 1 : 0);

                        const facets = (product.category && typeof product.category === 'object' && !Array.isArray(product.category))
                            ? product.category as { productTypes: string[]; occasions: string[]; colors: string[]; materials: string[]; cities: string[] }
                            : { productTypes: [], occasions: [], colors: [], materials: [], cities: [] };

                        return (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="relative w-16 h-20 bg-gray-100 rounded-none overflow-hidden">
                                        {primaryImage && (
                                            <Image
                                                src={primaryImage}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={product.name}>
                                        {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {product.product_id || `#${product.id}`}
                                    </div>
                                </td>
                                {showOwner && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-700">{owner ? owner.name : 'Unknown'}</div>
                                        {owner && (
                                            <>
                                                <div className="text-xs text-gray-500">{owner.phone}</div>
                                                {owner.email && <div className="text-xs text-gray-400">{owner.email}</div>}
                                            </>
                                        )}
                                    </td>
                                )}
                                {showFacets && (
                                    <>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {facets.productTypes.length > 0 ? (
                                                    facets.productTypes.map((pt, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-purple-100 text-purple-800">{pt}</span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {facets.occasions.length > 0 ? (
                                                    facets.occasions.map((oc, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-pink-100 text-pink-800">{oc}</span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {facets.colors.length > 0 ? (
                                                    facets.colors.map((c, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-red-100 text-red-800">{c}</span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {facets.materials.length > 0 ? (
                                                    facets.materials.map((m, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800">{m}</span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {facets.cities.length > 0 ? (
                                                    facets.cities.map((city, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-blue-100 text-blue-800">{city}</span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                            </div>
                                        </td>
                                    </>
                                )}
                                {showPricing && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{product.price}</div>
                                        {product.original_price && (
                                            <div className="text-xs text-gray-400">
                                                {typeof product.original_price === 'number' ? `₹${product.original_price}` : product.original_price}
                                            </div>
                                        )}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{imageCount}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs text-gray-500">
                                        {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : '-'}
                                    </div>
                                </td>
                                {showStatus && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${product.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : product.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : product.status === 'pending_deactivation'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {product.status === 'pending_deactivation' ? 'Deactivation Request' : product.status ? capitalizeFirstLetter(product.status) : 'Approved'}
                                            </span>
                                            {product.status === 'rejected' && product.admin_note && (
                                                <span className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={product.admin_note}>
                                                    Note: {product.admin_note}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={product.listing_status || 'Paid'}
                                        onChange={(e) => onUpdateListingStatus(product.id, e.target.value)}
                                        className={`text-xs font-medium px-2 py-1 rounded-none border focus:outline-none transition-colors duration-200 ${product.listing_status === 'Free'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : product.listing_status === 'Offer'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Free">Free</option>
                                        <option value="Offer">Offer</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex flex-col gap-2">
                                        {(product.status === 'pending' || product.status === 'pending_deactivation') && (onApprove || onReject) && (
                                            <div className="flex gap-2">
                                                {onApprove && (
                                                    <button
                                                        onClick={() => onApprove(product)}
                                                        className={`text-white px-2 py-1 rounded-none text-xs transition ${product.status === 'pending_deactivation'
                                                            ? 'bg-orange-600 hover:bg-orange-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                                            }`}
                                                    >
                                                        {product.status === 'pending_deactivation' ? 'Approve Deactivate' : 'Approve'}
                                                    </button>
                                                )}
                                                {onReject && (
                                                    <button
                                                        onClick={() => onReject(product)}
                                                        className="text-red-600 bg-white border border-red-200 hover:bg-red-50 px-2 py-1 rounded-none text-xs transition"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {onToggleStatus && product.status !== 'pending' && product.status !== 'pending_deactivation' && (
                                                <button
                                                    onClick={() => onToggleStatus(product)}
                                                    className={`px-3 py-1 text-white text-xs font-medium rounded-none transition-all duration-200 shadow-sm ${product.status === 'approved' && product.is_active !== false
                                                        ? 'bg-orange-500 hover:bg-orange-600'
                                                        : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                    title={product.status === 'approved' && product.is_active !== false ? "Move to Draft" : "Make Live"}
                                                >
                                                    {product.status === 'approved' && product.is_active !== false ? 'Unpublish' : 'Publish'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(product)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                title="Edit Product"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => onDelete(product)}
                                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                title="Delete Product"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

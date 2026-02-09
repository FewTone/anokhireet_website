"use client";

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
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Details</th>
                        {showOwner && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Owner</th>
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
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pricing</th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Images</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                        {showStatus && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Listing Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => {
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

'use client';

/**
 * Bidder Profile Card & Credentials Editor
 *
 * Allows bidders to view and update statutory company details:
 * Company Name, Registration Number (CIN), GSTIN, PAN, Udyam MSME,
 * Registered Address, and Authorized Contact.
 */

import { useState } from 'react';
import { Building2, Edit3, Save, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BidderProfile } from '@/types/tender-discovery';

interface BidderProfileCardProps {
  initialProfile: BidderProfile;
  onChange: (profile: BidderProfile) => void;
  isReadOnly?: boolean;
}

export function BidderProfileCard({
  initialProfile,
  onChange,
  isReadOnly = false,
}: BidderProfileCardProps) {
  const [profile, setProfile] = useState<BidderProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    onChange(profile);
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#111111] stroke-[1.5]" />
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.10em] text-[#111111]">
            Bidder Profile & Statutory Credentials
          </h3>
        </div>

        {!isReadOnly && (
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="h-8 px-3 bg-[#111111] hover:bg-[#222222] text-xs text-white gap-1.5 cursor-pointer rounded-md"
                >
                  <Save className="h-3 w-3" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 px-2.5 text-xs text-[#555555] hover:text-[#111111] cursor-pointer rounded-md"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2.5 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] bg-white gap-1.5 cursor-pointer rounded-md"
              >
                <Edit3 className="h-3 w-3" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-start gap-2.5 text-xs text-[#555555]">
        <Info className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
        <span>
          These credential values are cross-checked against uploaded GST certificates, PAN cards, and bidder undertakings during verification.
        </span>
      </div>

      {isEditing ? (
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              Company Legal Name
            </label>
            <input
              type="text"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              Registration Number (CIN / RoC)
            </label>
            <input
              type="text"
              value={profile.registrationNumber}
              onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] font-mono focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              GSTIN
            </label>
            <input
              type="text"
              value={profile.gstin}
              onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] font-mono focus:border-[#111111] focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              PAN Card Number
            </label>
            <input
              type="text"
              value={profile.pan}
              onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] font-mono focus:border-[#111111] focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              Udyam / MSME Registration (Optional)
            </label>
            <input
              type="text"
              value={profile.udyamNumber || ''}
              onChange={(e) => setProfile({ ...profile, udyamNumber: e.target.value })}
              placeholder="e.g. UDYAM-TN-02-0048192"
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] font-mono focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              Authorized Contact Person
            </label>
            <input
              type="text"
              value={profile.contactPerson}
              onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[#777777] uppercase tracking-wider font-mono text-[10px]">
              Registered Office Address
            </label>
            <input
              type="text"
              value={profile.registeredAddress}
              onChange={(e) => setProfile({ ...profile, registeredAddress: e.target.value })}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Company Name
            </span>
            <span className="font-semibold text-[#111111] truncate block">
              {profile.companyName}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              CIN / Registration No
            </span>
            <span className="font-mono text-[#111111] truncate block">
              {profile.registrationNumber || 'Pending entry'}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              GSTIN
            </span>
            <span className="font-mono text-[#111111] font-semibold truncate block">
              {profile.gstin}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              PAN
            </span>
            <span className="font-mono text-[#111111] truncate block">
              {profile.pan}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Udyam Registration (MSE)
            </span>
            <span className="font-mono text-[#111111] truncate block">
              {profile.udyamNumber || 'Not specified'}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Authorized Contact
            </span>
            <span className="text-[#111111] truncate block">
              {profile.contactPerson}
            </span>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Registered Office Address
            </span>
            <span className="text-[#555555]">
              {profile.registeredAddress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

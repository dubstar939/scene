import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { Car, MessageSquare, Navigation, Trash2, Eye, Ghost, Maximize2 } from "lucide-react";
import { Member, Spot } from "../types";

interface MapComponentProps {
  center: [number, number];
  mapLayer: "dark" | "satellite" | "traffic";
  setMapLayer: (layer: "dark" | "satellite" | "traffic") => void;
  isMapTab: boolean;
  setActiveTab: (tab: any) => void;
  spots: Spot[];
  members: Member[];
  currentUser: Member | null;
  currentUserLocation: [number, number] | null;
  isAddingSpot: boolean;
  newSpotForm: Partial<Spot>;
  favoriteMemberIds: string[];
  showOnlyFavorites: boolean;
  handleMapClick: (e: any) => void;
  handleDeleteSpot: (id: string) => void;
  handleStartDM: (member: Member) => void;
  setMapDisplayCenter: (location: [number, number]) => void;
  MapViewUpdater: React.FC<{ center: [number, number] }>;
  MapEventsHandler: React.FC<{ onMapClick: (e: any) => void; isAddingWaypoint: boolean; isAddingSpot: boolean }>;
  isAddingWaypoint: boolean;
  cruise: any;
  createWaypointIcon: (index: number) => L.DivIcon;
  createSpotMapIcon: (type: Spot["type"]) => L.DivIcon;
  createMemberMapIcon: (member: Member) => L.DivIcon;
  userMarkerIcon: L.DivIcon;
  CruisePolyline: React.FC<{ route: [number, number][] }>;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  mapLayer,
  setMapLayer,
  isMapTab,
  setActiveTab,
  spots,
  members,
  currentUser,
  currentUserLocation,
  isAddingSpot,
  newSpotForm,
  favoriteMemberIds,
  showOnlyFavorites,
  handleMapClick,
  handleDeleteSpot,
  handleStartDM,
  setMapDisplayCenter,
  MapViewUpdater,
  MapEventsHandler,
  isAddingWaypoint,
  cruise,
  createWaypointIcon,
  createSpotMapIcon,
  createMemberMapIcon,
  userMarkerIcon,
  CruisePolyline,
}) => {
  const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=default";

  return (
    <div className={`flex-1 relative ${isMapTab ? "h-[55%]" : "h-[15%]"} md:h-full order-1 md:order-2 transition-all duration-500`}>
      {/* Map Layer Controls */}
      {isMapTab ? (
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => {
              const layers: ("dark" | "satellite" | "traffic")[] = ["dark", "satellite", "traffic"];
              const currentIndex = layers.indexOf(mapLayer);
              const nextIndex = (currentIndex + 1) % layers.length;
              setMapLayer(layers[nextIndex]);
            }}
            className="p-3 rounded-2xl border backdrop-blur-xl transition-all shadow-xl bg-slate-900/80 border-white/10 text-white hover:bg-indigo-600 hover:border-indigo-500"
            title={`Toggle Map Layer (Current: ${mapLayer})`}
          >
            {mapLayer === "dark" ? (
              <Ghost size={18} />
            ) : mapLayer === "satellite" ? (
              <Eye size={18} />
            ) : (
              <Navigation size={18} />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setActiveTab("members")}
          className="absolute inset-0 z-[1000] bg-black/20 backdrop-blur-[1px] flex items-center justify-center group md:hidden"
        >
          <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-all flex items-center gap-2">
            <Maximize2 size={10} />
            Tap to Expand Map
          </div>
        </button>
      )}

      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={
            mapLayer === "satellite"
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : mapLayer === "traffic"
                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
          attribution="&copy; CAR SCENE v2"
        />
        <MapViewUpdater center={center} />
        <MapEventsHandler
          onMapClick={handleMapClick}
          isAddingWaypoint={isAddingWaypoint}
          isAddingSpot={isAddingSpot}
        />
        {cruise.isActive && <CruisePolyline route={cruise.route} />}
        {cruise.isActive &&
          cruise.route
            .slice(1)
            .map((p: [number, number], i: number) => (
              <Marker key={i} position={p} icon={createWaypointIcon(i)} />
            ))}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={spot.location}
            icon={createSpotMapIcon(spot.type)}
          >
            <Popup className="member-popup">
              <div className="min-w-[200px] p-0 bg-slate-900 text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="p-4 bg-slate-800/50 border-b border-white/5">
                  <h3 className="font-black italic uppercase text-sm text-white">
                    {spot.name}
                  </h3>
                  <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">
                    {spot.type} Spot
                  </span>
                </div>
                {spot.imageUrl && (
                  <div className="w-full h-24 border-b border-white/5">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {spot.description && (
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {spot.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMapDisplayCenter(spot.location)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Focus
                    </button>
                    {spot.createdBy === currentUser?.id && (
                      <button
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {isAddingSpot && newSpotForm.location && (
          <Marker
            position={newSpotForm.location as [number, number]}
            icon={createSpotMapIcon(newSpotForm.type as Spot["type"])}
          >
            <Popup>
              <div className="p-2 text-xs font-bold">New Spot Location</div>
            </Popup>
          </Marker>
        )}
        {members
          .filter((m) => m.status !== "Offline" && m.id !== currentUser?.id)
          .filter((m) => {
            if (m.id === currentUser?.id) return true;
            const isFavorite = favoriteMemberIds.includes(m.id);
            if (m.isGhost && !isFavorite) return false;
            if (m.privacy?.visibility === "favorites" && !isFavorite) return false;
            return !showOnlyFavorites || isFavorite;
          })
          .map((m) => (
            <Marker
              key={m.id}
              position={m.location}
              icon={createMemberMapIcon(m)}
            >
              <Popup className="member-popup">
                <div className="min-w-[180px] p-0 bg-slate-900 text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 border-b border-white/5">
                    <div className="relative">
                      <img
                        src={m.avatar || DEFAULT_AVATAR}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black italic uppercase text-xs truncate leading-tight text-white">
                        {m.name}
                      </p>
                      <span className="text-[8px] text-emerald-400 flex items-center gap-1 font-black uppercase tracking-wider mt-0.5">
                        <Navigation size={8} className="animate-pulse" />{" "}
                        {m.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2.5">
                    {m.car && (
                      <div className="flex items-center gap-2 text-indigo-300 bg-indigo-500/10 px-2.5 py-2 rounded-xl border border-indigo-500/20">
                        <Car size={12} className="text-indigo-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-0.5">
                            Verified Build
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-tight truncate leading-none">
                            {m.car}
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleStartDM(m)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                      <MessageSquare size={12} />
                      Send Message
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        {currentUser &&
          currentUser.status !== "Offline" &&
          currentUserLocation && (
            <Marker position={currentUserLocation} icon={userMarkerIcon} />
          )}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapComponent);

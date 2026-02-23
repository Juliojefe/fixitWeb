"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./map.module.css";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        (markerIcon2x as unknown as { src: string }).src ??
        (markerIcon2x as unknown as string),
    iconUrl:
        (markerIcon as unknown as { src: string }).src ??
        (markerIcon as unknown as string),
    shadowUrl:
        (markerShadow as unknown as { src: string }).src ??
        (markerShadow as unknown as string),
});

type LocationIQPlace = {
    place_id?: string | number;
    display_name?: string;
    lat?: string;
    lon?: string;
    [key: string]: any;
};

function toNumber(s: unknown): number | null {
    if (typeof s !== "string") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

export default function MapPage() {
    const API_BASE = "http://localhost:8080";

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<LocationIQPlace[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hint, setHint] = useState<string>("");

    const [center, setCenter] = useState<[number, number]>([36.6777, -121.6555]); // CSUMB
    const [marker, setMarker] = useState<{ lat: number; lon: number; label: string } | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<number | null>(null);

    const mapRef = useRef<L.Map | null>(null);

    const canAutocomplete = useMemo(() => query.trim().length >= 2, [query]);

    async function fetchAutocomplete(q: string) {
        if (!canAutocomplete) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setHint("Searching...");

        try {
            const url = `${API_BASE}/api/geocode/autocomplete?q=${encodeURIComponent(q)}&limit=10`;

            const res = await fetch(url, {
                signal: controller.signal,
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Autocomplete failed: ${res.status} ${text}`);
            }

            const data = (await res.json()) as LocationIQPlace[];
            setSuggestions(Array.isArray(data) ? data : []);
            setOpen(true);
            setHint("");
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            console.error(err);
            setSuggestions([]);
            setOpen(false);
            setHint("Autocomplete error (check backend logs).");
        } finally {
            setLoading(false);
        }
    }

    async function fetchSearch(q: string) {
        setLoading(true);
        setHint("Searching...");

        try {
            const url = `${API_BASE}/api/geocode/search?q=${encodeURIComponent(q)}&limit=10`;

            const res = await fetch(url, {
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Search failed: ${res.status} ${text}`);
            }

            const data = (await res.json()) as LocationIQPlace[];
            const first = Array.isArray(data) && data.length > 0 ? data[0] : null;

            if (!first) {
                setHint("No results.");
                return;
            }

            selectPlace(first);
        } catch (err) {
            console.error(err);
            setHint("Search error (check backend logs).");
        } finally {
            setLoading(false);
        }
    }

    function selectPlace(place: LocationIQPlace) {
        const lat = toNumber(place.lat);
        const lon = toNumber(place.lon);
        const label = place.display_name ?? "Selected location";

        if (lat == null || lon == null) {
            setHint("Result missing lat/lon.");
            return;
        }

        setMarker({ lat, lon, label });
        setCenter([lat, lon]);

        if (mapRef.current) {
            mapRef.current.flyTo([lat, lon], 13, { animate: true, duration: 0.7 });
        }

        setQuery(label);
        setOpen(false);
        setSuggestions([]);
        setHint("");
    }

    useEffect(() => {
        const q = query.trim();

        if (q.length < 2) {
            abortRef.current?.abort();
            setSuggestions([]);
            setOpen(false);
            setHint("");
            return;
        }

        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            fetchAutocomplete(q);
        }, 250);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [query]);

    const searchBlockRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        function onDocMouseDown(e: MouseEvent) {
            const el = searchBlockRef.current;
            if (!el) return;
            if (e.target instanceof Node && !el.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    function onSubmitSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        const q = query.trim();
        if (!q) return;

        setOpen(false);
        abortRef.current?.abort();
        fetchSearch(q);
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Map</h1>

            <div ref={searchBlockRef} className={styles.searchBlock}>
                <form className={styles.searchRow} onSubmit={onSubmitSearch}>
                    <input
                        className={styles.searchInput}
                        value={query}
                        placeholder="Enter a place or address..."
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (suggestions.length > 0) setOpen(true);
                        }}
                        aria-label="Search"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className={styles.searchButton}
                        disabled={!query.trim() || loading}
                    >
                        Search
                    </button>
                </form>

                {(loading || hint) && (
                    <div className={styles.hint}>{loading ? "Searching..." : hint}</div>
                )}

                {open && suggestions.length > 0 && (
                    <div className={styles.suggestions} role="listbox">
                        {suggestions.map((s, idx) => {
                            const name = s.display_name ?? "";
                            const [primary, ...rest] = name.split(",");
                            const secondary = rest.join(",").trim();

                            return (
                                <button
                                    key={`${s.place_id ?? idx}`}
                                    className={styles.suggestionItem}
                                    type="button"
                                    onClick={() => selectPlace(s)}
                                >
                                    <div className={styles.suggestionPrimary}>
                                        {primary || name}
                                    </div>
                                    {secondary ? (
                                        <div className={styles.suggestionSecondary}>
                                            {secondary}
                                        </div>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer
                    center={center}
                    zoom={12}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%" }}
                    whenReady={(e: any) => {
                        mapRef.current = e?.target ?? mapRef.current;
                    }}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {marker && (
                        <Marker position={[marker.lat, marker.lon]}>
                            <Popup>{marker.label}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
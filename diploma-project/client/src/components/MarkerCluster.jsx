import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

/**
 * Компонент кластеризации маркеров через leaflet.markercluster
 * markers: [{ id, lat, lng, icon, popup: ReactNode }]
 * onMarkerClick: (marker) => void
 */
const MarkerCluster = ({ markers, onMarkerClick }) => {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Удаляем старый кластер
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size = count < 10 ? 36 : count < 50 ? 44 : 52;
        return L.divIcon({
          html: `<div class="mc-cluster" style="width:${size}px;height:${size}px">
            <span class="material-icons" style="font-size:${size * 0.45}px">park</span>
            <span class="mc-count">${count}</span>
          </div>`,
          className: '',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });

    markers.forEach(m => {
      const marker = L.marker([parseFloat(m.lat), parseFloat(m.lng)], { icon: m.icon });
      if (m.popupHtml) marker.bindPopup(m.popupHtml);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(m));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current);
    };
  }, [map, markers, onMarkerClick]);

  return null;
};

export default MarkerCluster;

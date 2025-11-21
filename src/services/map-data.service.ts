import { Injectable } from '@angular/core';
import * as L from 'leaflet';

interface StoredMarker {
  lat: number;
  lng: number;
}

interface StoredCircle {
  lat: number;
  lng: number;
  radius: number;
}

interface MapStorage {
  markers: StoredMarker[];
  polygons: [number, number][][];
  polylines: [number, number][][];
  rectangle: [number, number][][];
  circles: StoredCircle[];
}

@Injectable({
  providedIn: 'root'
})
export class MapDataService {

  private storageKey = 'mapLayers';

  constructor() {}

  private save(data: MapStorage): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private load(): MapStorage {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return {
        markers: [],
        polygons: [],
        polylines: [],
        circles: [],
        rectangle: []
      };
    }

    return JSON.parse(raw) as MapStorage;
  }

  // ================================
  // ADD
  // ================================
  addMarker(lat: number, lng: number): void {
    const data = this.load();
    data.markers.push({ lat, lng });
    this.save(data);
  }

  addPolygon(latlngs: [number, number][]): void {
    const data = this.load();
    data.polygons.push(latlngs);
    this.save(data);
  }

  addPolyline(latlngs: [number, number][]): void {
    const data = this.load();
    data.polylines.push(latlngs);
    this.save(data);
  }

  addCircle(lat: number, lng: number, radius: number): void {
    const data = this.load();
    data.circles.push({ lat, lng, radius });
    this.save(data);
  }

  addRectangle(latlngs: [number, number][]): void {
    const data = this.load();
    data.rectangle.push(latlngs);
    this.save(data);
  }

  // ================================
  // REBUILD STORAGE FROM FEATURE GROUP
  // ================================
  rebuildFromFeatureGroup(featureGroup: L.FeatureGroup): void {
    const data: MapStorage = {
      markers: [],
      polygons: [],
      polylines: [],
      circles: [],
      rectangle: []
    };

    featureGroup.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        const pos = layer.getLatLng();
        data.markers.push({ lat: pos.lat, lng: pos.lng });
      }

      else if (layer instanceof L.Polygon) {
        const ring = (layer.getLatLngs() as L.LatLng[][])[0];
        const arr = ring.map(p => [p.lat, p.lng] as [number, number]);
        data.polygons.push(arr);
      }

      else if (layer instanceof L.Polyline) {
        const points = layer.getLatLngs() as L.LatLng[];
        const arr = points.map(p => [p.lat, p.lng] as [number, number]);
        data.polylines.push(arr);
      }

      else if (layer instanceof L.Circle) {
        const c = layer.getLatLng();
        data.circles.push({ lat: c.lat, lng: c.lng, radius: layer.getRadius() });
      }

      else if (layer instanceof L.Rectangle) {
        const ring = (layer.getLatLngs() as L.LatLng[][])[0];
        const arr = ring.map(p => [p.lat, p.lng] as [number, number]);
        data.polygons.push(arr);
      }
    });

    this.save(data);
  }

  // ================================
  // LOAD TO MAP
  // ================================
  loadAllLayers(map: L.Map, featureGroup: L.FeatureGroup): void {
    const data = this.load();

    data.markers.forEach(m => {
      featureGroup.addLayer(L.marker([m.lat, m.lng]));
    });

    data.polygons.forEach(poly => {
      featureGroup.addLayer(L.polygon(poly));
    });

    data.polylines.forEach(line => {
      featureGroup.addLayer(L.polyline(line));
    });

    data.circles.forEach(c => {
      featureGroup.addLayer(L.circle([c.lat, c.lng], { radius: c.radius }));
    });

    data.rectangle.forEach(r => {
      featureGroup.addLayer(L.rectangle(r));
    });
  }
}

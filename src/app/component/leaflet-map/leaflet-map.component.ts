import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { MapDataService } from 'src/services/map-data.service';

L.Icon.Default.imagePath = 'assets/leaflet/';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
})
export class LeafletMapComponent implements OnInit {
  private map!: L.Map;
  private drawnItems!: L.FeatureGroup;

  constructor(public mapDataService: MapDataService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeMap();
      this.enableDrawingTools();
      this.mapDataService.loadAllLayers(this.map, this.drawnItems);
    }, 100);
  }

  private initializeMap(): void {
    this.map = L.map('map', {
      center: [-15.77972, -47.92972],
      zoom: 5
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);
  }

  private enableDrawingTools(): void {
    if (!this.map) return;

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems,
      },
      draw: {
        polyline: { shapeOptions: { color: 'blue', weight: 4 } },
        polygon: { shapeOptions: { color: 'green', weight: 3 } },
        rectangle: { shapeOptions: { color: 'red', weight: 2 } },
        circle: { shapeOptions: { color: 'purple', weight: 2 } },
        marker: {},
      },
    });

    this.map.addControl(drawControl);

    // === CRIAR ===
    this.map.on('draw:created', (event: any) => {
      const layer = event.layer;
      this.drawnItems.addLayer(layer);
      this.saveDrawnLayer(layer);
    });

    // === REMOVER ===
    this.map.on('draw:deleted', () => {
      this.mapDataService.rebuildFromFeatureGroup(this.drawnItems);
    });

    // === EDITAR ===
    this.map.on('draw:edited', () => {
      this.mapDataService.rebuildFromFeatureGroup(this.drawnItems);
    });
  }

  private saveDrawnLayer(layer: L.Layer): void {
    if (layer instanceof L.Marker) {
      const pos = layer.getLatLng();
      this.mapDataService.addMarker(pos.lat, pos.lng);
    }

    else if (layer instanceof L.Polygon) {
      const ring = (layer.getLatLngs() as L.LatLng[][])[0];
      const latlngs = ring.map(p => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addPolygon(latlngs);
    }

    else if (layer instanceof L.Polyline) {
      const points = layer.getLatLngs() as L.LatLng[];
      const latlngs = points.map(p => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addPolyline(latlngs);
    }

    else if (layer instanceof L.Rectangle) {
      const ring = (layer.getLatLngs() as L.LatLng[][])[0];
      const latlngs = ring.map(p => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addPolygon(latlngs);
    }

    else if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      this.mapDataService.addCircle(center.lat, center.lng, layer.getRadius());
    }
  }
}

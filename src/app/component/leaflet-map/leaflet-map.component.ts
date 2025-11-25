import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { MapDataService } from 'src/services/map-data.service';
import { AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

L.Icon.Default.imagePath = 'assets/leaflet/';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class LeafletMapComponent implements OnInit {
  private map!: L.Map;
  private drawnItems!: L.FeatureGroup;

  // === MARCADOR DA PESQUISA (ADICIONADO) ===
  @Input() searchQuery: string = '';

  private searchMarker!: L.Marker;

  constructor(
    public mapDataService: MapDataService,
    private alertCtrl: AlertController
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery'] && this.searchQuery) {
      this.searchLocation(this.searchQuery);
    }
  }

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
      zoom: 5,
    });

    this.captureClickOnMarkerPopup();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // this.loadMarkers();
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
        rectangle: {
          shapeOptions: { color: 'red', weight: 2 },
          showArea: false,
        },
        circle: { shapeOptions: { color: 'purple', weight: 2 } },
        marker: {},

        // outras opções …
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

  private zoomToMarker(lat: number, lng: number): void {
    this.map.setView([lat, lng], 16);
  }


  private captureClickOnMarkerPopup(): void {
    this.map.on('popupopen', (e: any) => {
      const popupNode = e.popup.getElement();
      const zoomBtn = popupNode.querySelector('.zoom-to-marker-btn');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
          const latlng = e.popup.getLatLng();
          this.zoomToMarker(latlng.lat, latlng.lng);
        });
      }
    });
  }      

  private saveDrawnLayer(layer: L.Layer): void {
    console.log('Layer drawn:', layer);
    if (layer instanceof L.Marker) {
      const pos = layer.getLatLng();
      this.askMarkerName(layer, pos); // agora passa o layer!
    } else if (layer instanceof L.Rectangle) {
      const ring = (layer.getLatLngs() as L.LatLng[][])[0];
      const latlngs = ring.map((p) => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addRectangle(latlngs);
    } else if (layer instanceof L.Polygon) {
      const ring = (layer.getLatLngs() as L.LatLng[][])[0];
      const latlngs = ring.map((p) => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addPolygon(latlngs);
    } else if (layer instanceof L.Polyline) {
      const points = layer.getLatLngs() as L.LatLng[];
      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      this.mapDataService.addPolyline(latlngs);
    } else if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      this.mapDataService.addCircle(center.lat, center.lng, layer.getRadius());
    }
  }

  private async askMarkerName(layer: L.Marker, pos: L.LatLng) {
    const alert = await this.alertCtrl.create({
      header: 'Nome do Marcador',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Digite o nome',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.map.removeLayer(layer); // remove o marker que o user criou
          },
        },
        {
          text: 'Salvar',
          handler: (data) => {
            const name = (data?.name || '').trim();

            if (!name) {
              window.alert('Por favor, digite um name para o marcador.');
              return false;
            }

            // Salvar no storage
            this.mapDataService.addMarker({ lat: pos.lat, lng: pos.lng, name });
            console.log(name);

            layer.bindPopup(
  `<div class="popup-card">
     <h3>${name}</h3>
     <p>Latitude: ${pos.lat}</p>
     <p>Longitude: ${pos.lng}</p>

     <a 
        class="zoom-to-marker-btn"
     >
        Olhar mais de perto
     </a>

   </div>`
).openPopup();


            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  public async searchLocation(searchQuery: string): Promise<void> {
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    console.log('Searching for:', query);

    // Bypass de CORS (funciona em localhost e produção)
    const url = `search?format=json&q=${query}`;

    try {
      const response = await fetch(url);
      const results = await response.json();

      if (!results || results.length === 0) {
        alert('Local não encontrado!');
        return;
      }

      const place = results[0];
      const lat = Number(place.lat);
      const lon = Number(place.lon);

      // Remove marcador anterior da pesquisa
      if (this.searchMarker) {
        this.map.removeLayer(this.searchMarker);
      }

      // Novo marcador
      const icon = L.icon({
        iconUrl: 'assets/leaflet/marker_world.svg',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'assets/leaflet/marker-shadow.png',
        shadowSize: [41, 41],
      });
      this.searchMarker = L.marker([lat, lon], { icon: icon }).addTo(this.map);

      // Aplica popup no marcador

      const parts = place.display_name.split(',').map((p: string) => p.trim());

      const first = parts[0]; // primeiro
      const last = parts[parts.length - 2]; // último

      this.searchMarker.bindPopup(`<b>${first} - ${last}</b>`).openPopup();

      //  this.searchMarker.bindPopup(place.display_name).openPopup();

      // Centraliza com zoom definido
      this.map.setView([lat, lon], 16);
    } catch (error) {
      console.error('Erro na pesquisa:', error);
    }
  }
}

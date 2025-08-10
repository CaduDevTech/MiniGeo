import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw'; // Importando o leaflet-draw corretamente

L.Icon.Default.imagePath = 'assets/leaflet/';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
})
export class LeafletMapComponent implements OnInit {
  private map: L.Map | undefined;

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([-15.77972, -47.92972], 5);

    // Adicionando a camada base do OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Adicionando um marcador inicial
    L.marker([-15.77972, -47.92972])
      .addTo(this.map)
      .bindPopup('Centro do Mapa.<br>Bem-vindo ao mapa interativo!')
      .openPopup();

    // Ativar a funcionalidade de desenho
    this.addDrawingTools();
  }

  private addDrawingTools(): void {
    if (!this.map) return;

    const drawnItems = new L.FeatureGroup();
    this.map.addLayer(drawnItems);

    // Configuração do controle de desenho
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polyline: {
          shapeOptions: {
            color: 'blue', // Cor da linha
            weight: 4, // Espessura da linha
          },
        },
        polygon: {
          shapeOptions: {
            color: 'green', // Cor do polígono
            weight: 3, // Espessura da linha do polígono
          },
        },
        rectangle: {
          shapeOptions: {
            color: 'red', // Cor do retângulo
            weight: 2, // Espessura da linha do retângulo
          },
        },
        circle: {
          shapeOptions: {
            color: 'purple', // Cor do círculo
            weight: 2, // Espessura da linha do círculo
          },
        },
        marker: {},
      },
    });
    console.log('Drawing tools added to the map');

    // Adiciona o controle de desenho no mapa
    this.map.addControl(drawControl);

    // Evento para adicionar os desenhos ao grupo
    this.map.on('draw:created', (event: L.LeafletEvent) => {
      const layer = event.layer as L.Layer;
      drawnItems.addLayer(layer);
      console.log('New layer added:', layer);
    });
  }
}

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet :key="$route.fullPath"></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="mapa" href="/tabs/mapa">
          <ion-icon aria-hidden="true" :icon="map" />
          <ion-label>Mapa</ion-label>
        </ion-tab-button>

        <!-- <ion-tab-button tab="tab2" href="/tabs/news">
          <ion-icon aria-hidden="true" :icon="newspaper" />
          <ion-label>News</ion-label>
        </ion-tab-button> -->

        <!-- <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon aria-hidden="true" :icon="square" />
          <ion-label>Tab 3</ion-label>
        </ion-tab-button> -->
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { newspaper, map} from 'ionicons/icons';
</script>

import { MapContainer, TileLayer } from 'react-leaflet';
import { useLanguage } from '../contexts/LanguageContext';

// Тайловые серверы с поддержкой языка
const getTileUrl = (lang) => {
  // Используем разные тайловые серверы в зависимости от языка
  // Для RU/BE — OSM с кириллическими названиями (стандартный OSM уже показывает их)
  // Для EN — CartoDB Positron (английские названия)
  switch (lang) {
    case 'EN':
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    default:
      // RU и BE — стандартный OSM (показывает кириллицу для СНГ)
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
};

const getAttribution = (lang) => {
  switch (lang) {
    case 'BE': return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> удзельнікі';
    case 'EN': return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
    default:   return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> участники';
  }
};

const LocalizedMap = ({ children, ...props }) => {
  const { currentLanguage } = useLanguage();

  return (
    // key на MapContainer — полное перемонтирование при смене языка
    <MapContainer key={currentLanguage} {...props} attributionControl={true}>
      <TileLayer
        url={getTileUrl(currentLanguage)}
        attribution={getAttribution(currentLanguage)}
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
};

export default LocalizedMap;

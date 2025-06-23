export const getMensaImage = (id: string) => {
    const mapping: Record<string, any> = {
        '655ff175136d3b580c970f7b': require('@/assets/images/mensen/MensaASHBerlinHellersdorf.jpg'),
        '655ff175136d3b580c970f7c': require('@/assets/images/mensen/MensaHfMCharlottenstraße.jpg'),
        '655ff175136d3b580c970f7d': require('@/assets/images/mensen/MensaBHTLuxemburgerStraße.jpg'),
        '655ff175136d3b580c970f7e': require('@/assets/images/mensen/MensaBackshopBHTLuxemburgerStraße.jpg'),
        '655ff175136d3b580c970f7f': require('@/assets/images/mensen/MensaSpäti.jpg'),
        '655ff175136d3b580c970f80': require('@/assets/images/mensen/MensaHTWTreskowallee.jpg'),
        '655ff175136d3b580c970f81': require('@/assets/images/mensen/MensaHTWWilhelminenhof.jpg'),
        '655ff175136d3b580c970f82': require('@/assets/images/mensen/MensaChariteZahnklinik.jpg'),
        '655ff175136d3b580c970f83': require('@/assets/images/mensen/MensaHUSüd.jpg'),
        '655ff175136d3b580c970f84': require('@/assets/images/mensen/MensaSpäti.jpg'),
        '655ff175136d3b580c970f85': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff175136d3b580c970f86': require('@/assets/images/mensen/MensaEHBTeltowerDamm.jpg'),
        '655ff175136d3b580c970f87': require('@/assets/images/mensen/MensaSpäti.jpg'),
        '655ff175136d3b580c970f88': require('@/assets/images/mensen/MensaFUHerrenhausDüppel.jpg'),
        '655ff175136d3b580c970f89': require('@/assets/images/mensen/MensaFUIShokudō.jpg'),
        '655ff175136d3b580c970f8a': require('@/assets/images/mensen/MensaFUII.jpg'),
        '655ff175136d3b580c970f8b': require('@/assets/images/mensen/MensaFUKoserstraße.jpg'),
        '655ff175136d3b580c970f8c': require('@/assets/images/mensen/MensaFULankwitzMalteserstraße.jpg'),
        '655ff175136d3b580c970f8d': require('@/assets/images/mensen/MensaFUPharmazie.jpg'),
        '655ff175136d3b580c970f8e': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff175136d3b580c970f8f': require('@/assets/images/mensen/MensaSpäti.jpg'),
        '655ff175136d3b580c970f91': require('@/assets/images/mensen/MensaHfSErnstBusch.jpg'),
        '655ff175136d3b580c970f92': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff175136d3b580c970f93': require('@/assets/images/mensen/MensaHWRBadenscheStraße.jpg'),
        '655ff175136d3b580c970f94': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff176136d3b580c970f95': require('@/assets/images/mensen/MensaHUNord.jpg'),
        '655ff176136d3b580c970f96': require('@/assets/images/mensen/MensaHUOaseAdlershof.jpg'),
        '655ff176136d3b580c970f97': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff176136d3b580c970f98': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff176136d3b580c970f9a': require('@/assets/images/mensen/MensaKHSB.jpg'),
        '655ff176136d3b580c970f9d': require('@/assets/images/mensen/MensaTUHardenbergstraße.jpg'),
        '655ff176136d3b580c970f9e': require('@/assets/images/mensen/MensaTUMarchstraße.jpg'),
        '655ff176136d3b580c970f9f': require('@/assets/images/mensen/MensaTUVeggie.jpg'),
        '655ff176136d3b580c970fa0': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff176136d3b580c970fa1': require('@/assets/images/mensen/MensaBackshop.jpg'),
        '655ff176136d3b580c970fa2': require('@/assets/images/mensen/MensaKHSWeißensee.jpg'),
        '659dde8cf83c5c19ab14fe5c': require('@/assets/images/mensen/MensaSpäti.jpg'),
        '664006eb0489751ef00c9ebd': require('@/assets/images/mensen/MensaSpäti.jpg'),

        // Weitere Mensa-Bilder hier hinzufügen
    };

    // Fallback-Bild, falls keine ID zugewiesen ist
    return mapping[id] || require('@/assets/images/cafeteria.png');
};

// Mensa-ID Übersicht:
// '655ff175136d3b580c970f7b'  // Mensa ASH Berlin Hellersdorf
// '655ff175136d3b580c970f7c'  // Mensa HfM Charlottenstraße
// '655ff175136d3b580c970f7d'  // Mensa BHT Luxemburger Straße
// '655ff175136d3b580c970f7e'  // Mensa-Backshop BHT Luxemburger Straße
// '655ff175136d3b580c970f7f'  // Mensa-Späti BHT Haus Grashof
// '655ff175136d3b580c970f80'  // Mensa HTW Treskowallee
// '655ff175136d3b580c970f81'  // Mensa HTW Wilhelminenhof
// '655ff175136d3b580c970f82'  // Mensa Charité Zahnklinik
// '655ff175136d3b580c970f83'  // Mensa HU Süd
// '655ff175136d3b580c970f84'  // Mensa-Späti Charité Zahnklinik
// '655ff175136d3b580c970f85'  // Mensa-Backshop HfM Charlottenstraße
// '655ff175136d3b580c970f86'  // Mensa EHB Teltower Damm
// '655ff175136d3b580c970f87'  // Mensa-Späti EHB Teltower Damm
// '655ff175136d3b580c970f88'  // Mensa FU Herrenhaus Düppel
// '655ff175136d3b580c970f89'  // Mensa FU I Shokudō
// '655ff175136d3b580c970f8a'  // Mensa FU II
// '655ff175136d3b580c970f8b'  // Mensa FU Koserstraße
// '655ff175136d3b580c970f8c'  // Mensa FU Lankwitz Malteserstraße
// '655ff175136d3b580c970f8d'  // Mensa FU Pharmazie
// '655ff175136d3b580c970f8e'  // Mensa-Backshop FU Rechtswissenschaften
// '655ff175136d3b580c970f8f'  // Mensa-Späti Shokudō (FU I)
// '655ff175136d3b580c970f91'  // Mensa HfS Ernst Busch
// '655ff175136d3b580c970f92'  // Mensa-Backshop HTW Wilhelminenhof
// '655ff175136d3b580c970f93'  // Mensa HWR Badensche Straße
// '655ff175136d3b580c970f94'  // Mensa-Backshop HWR Alt-Friedrichsfelde
// '655ff176136d3b580c970f95'  // Mensa HU Nord
// '655ff176136d3b580c970f96'  // Mensa HU Oase Adlershof
// '655ff176136d3b580c970f97'  // Mensa-Backshop HU „c.t.“
// '655ff176136d3b580c970f98'  // Mensa-Backshop HU Oase Adlershof
// '655ff176136d3b580c970f9a'  // Mensa KHSB
// '655ff176136d3b580c970f9d'  // Mensa TU Hardenbergstraße
// '655ff176136d3b580c970f9e'  // Mensa TU Marchstraße
// '655ff176136d3b580c970f9f'  // Mensa TU Veggie 2.0 – Die vegane Mensa
// '655ff176136d3b580c970fa0'  // Mensa-Backshop TU Hardenbergstraße
// '655ff176136d3b580c970fa1'  // Mensa-Backshop TU Wetterleuchten
// '655ff176136d3b580c970fa2'  // Mensa KHS Weißensee
// '659dde8cf83c5c19ab14fe5c'  // Mensa-Späti FU Garystraße
// '664006eb0489751ef00c9ebd'  // Mensa-Späti TU Hardenbergstraße
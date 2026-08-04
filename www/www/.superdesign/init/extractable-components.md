# Extractable Components

## HomeSelector
- Source: `stitch-home.html`, `stitch-smart.html`, `stitch-discover.html`
- Category: layout
- Description: Üstte mevcut ev seçici, ikonlu ve aşağı okla açılan pill
- Extractable props: `householdName`
- Hardcoded: ev ikonu, degrade avatar dairesi, "Mevcut Ev" üst label

## BottomNav
- Source: `stitch-home.html`, `stitch-smart.html`, `stitch-discover.html`, `stitch-login.html`
- Category: layout
- Description: dört sekmeli alt gezinme çubuğu
- Extractable props: `activeItem`
- Hardcoded: ikon isimleri, sekme etiketleri, blur cam yüzey

## AiSearchBar
- Source: `stitch-home.html`, `stitch-smart.html`
- Category: basic
- Description: gradient outline NEXUS arama / sohbet girişi
- Extractable props: `placeholder`, `helperHref`
- Hardcoded: logo monogramı, mikrofon ikonu, dış çizgi gradienti

## QuickAddSheet
- Source: `stitch-home.html`, `stitch-smart.html`
- Category: layout
- Description: alttan açılan hızlı aksiyon menüsü
- Extractable props: `items`
- Hardcoded: üst handle, close button, NEXUS monogram hero

## SettingsCardSection
- Source: `stitch-settings.html`
- Category: basic
- Description: rounded white settings group with rows and chevrons
- Extractable props: `title`, `rows`
- Hardcoded: white surface, divider styles, row spacing

## PickerRow
- Source: `stitch-cards.html`
- Category: basic
- Description: kart ekle ekranındaki seçilebilir satır
- Extractable props: `title`, `subtitle`, `selected`, `icon`
- Hardcoded: left check-circle interaction, row divider

## RecommendationCard
- Source: `stitch-smart.html`
- Category: basic
- Description: akıllı uygulama öneri kartı
- Extractable props: `title`, `subtitle`, `image`, `meta`
- Hardcoded: card shell, CTA placement, soft shadow system

# Norda Tech Supplies — 3.0

B2B IT təchizat saytı: 34 əsas səhifə/mövzu, üç dildə 102 HTML ünvanı. 19 kateqoriya, 114 məhsul qrupu. Sayt statikdir və cPanel hostinqində Node.js, WordPress və verilənlər bazası tələb etmir.

## Yerli iş və yeniləmə

Node.js 20 və ya daha yeni versiya ilə:

- `node build-site.mjs` — bütün səhifələri və sitemap-ı yeniləyir.
- `node verify-build.mjs` — bütün səhifələrdə link, resurs, dil, ARIA, hash və unikal şəkilləri yoxlayır.
- `node preview.mjs` — http://127.0.0.1:4173 ünvanında baxış açır.
- `node audit-http.mjs` — baxış serveri işləyərkən 102 səhifənin və resursların HTTP/MIME yoxlamasını aparır.

Hazır WebP faylları mənbəyə daxildir; adi HTML build üçün əlavə paket quraşdırmaq lazım deyil. Şəkilləri yenidən optimallaşdırmaq üçün `npm install`, sonra `npm run optimize` istifadə edin. Bu addım Sharp tələb edir və orijinalları dəyişmir.

## Fayllar

- `build-site-v3.mjs` — ümumi quruluş və bütün səhifə şablonları.
- `ui-components.mjs` — ikonlar, sürətli sorğu və məxfilik pəncərələri.
- `site-content.mjs`, `catalog-expansion.mjs` — üç dildə kateqoriya və məhsul qrupları.
- `experience-content.mjs` — şirkət, təchizat, beynəlxalq tədarük, sahələr, FAQ və bələdçilər.
- `brand-content.mjs`, `brand-logos.json` — brend məlumatları və loqo faylları.
- `category-media.mjs` — hər kateqoriyanın ayrıca şəkli.
- `dist/site-v3.css`, `dist/app-v3.js` — görünüş, naviqasiya, sorğu və animasiya.
- `artwork-originals/` — toxunulmamış orijinal PNG-lər.
- `dist/assets/optimized/` — 1200 px əsas və 600 px kiçik WebP versiyaları; loqo ayrıca ölçüdədir.
- `ASSET-NOTES.md`, `BRAND-SOURCES.md` — vizual promptları və brend mənbələri.

Yaradılmış HTML-i əl ilə dəyişməyin; növbəti build onu yeniləyir.

## Səhifələr

Ana səhifə, kataloq və 19 kateqoriyadan əlavə: Haqqımızda, Təchizat, Beynəlxalq tədarük, Brendlər, Sahələr, Satınalma bələdçisi, Suallar, Əlaqə, Qiymət sorğusu, Məxfilik və üç praktiki bələdçi. Hər biri AZ/EN/RU dillərindədir. Dil keçidi eyni mövzuda saxlanır. Əvvəlki ana səhifənin #about, #contact və #techizat keçidləri yeni uyğun səhifələrə aparır.

## Sorğu və məlumatlar

Məhsul qrupları və sayları bir sorğuya əlavə edilir. Ayrıca sorğu səhifəsində önizləmə var. WhatsApp və e-poçt düymələri göndərməyə hazır mətn açır; son göndərməni müştəri tamamlayır. TXT yükləmə də mövcuddur. Sayt avtomatik e-poçt göndərmir və serverdə sorğu bazası saxlamır.

Brauzerdə `norda-theme` və `norda-selection-v2` açarları ilə yalnız rəng seçimi, məhsul ID-ləri və saylar saxlanılır. Şirkət, ad, telefon, e-poçt və sorğu mətninin qalıcı yaddaşa yazılması yoxdur. Analitika və reklam izləyicisi əlavə edilməyib.

Animasiya ayrıca düymə olmadan avtomatik aktivdir. İlk ekran səhnəsi, orbitlər, hissəciklər, axınlar, parallax, kartlar, brend zolağı, proses xətti və səhifə keçidləri işləyir. Mobil hissəcik sayı azaldılır; görünməyən səhifə/hero üçün canvas hesablaması dayandırılır. Avtomatik səhnə seçimi üzərinə gələndə və fokus olduqda dayanır.

## cPanel

1. Mövcud saytın ehtiyat nüsxəsini endirin.
2. cPanel → Domains ilə nordatech.az domeninin Document Root qovluğunu yoxlayın.
3. `nordatech-cpanel.zip` içindəkiləri həmin qovluğa açın. `index.html`, `site-v3.css`, `app-v3.js`, `products/`, `guides/` və `assets/` birbaşa Document Root daxilində olmalıdır.
4. DNS və SSL-i yoxlayın; telefon, e-poçt və WhatsApp keçidlərini real cihazda sınayın.

Paketə `artwork-originals/`, build skriptləri və node_modules yüklənməməlidir. Bunlar yalnız mənbə kodu üçündür.

Git ilə yerləşdirmə üçün mənbənin kökündə `.cpanel.yml` var. İstifadəçinin təqdim etdiyi `/home/nordaffk/public_html/` hədəfi saxlanılıb; nordatech.az domeninin Document Root-u ilə uyğunluğunu paneldə yoxlayın. Konfiqurasiya yalnız hazır `dist/` qovluğunun içindəkiləri köçürür; mənbə skriptləri və orijinal şəkillər yayımlanmır. Build əvvəlcədən yerli kompüterdə edilir və yenilənmiş `dist/` Git-ə daxil edilir. cPanel-də `Update from Remote`, sonra `Deploy HEAD Commit` istifadə edin. Köhnə faylları silmir, e-poçt/DNS/SSL ayarlarını dəyişmir. ZIP ilə əl ilə yükləmə zamanı `.cpanel.yml` lazım deyil və `public_html` daxilinə qoyulmur.

Rəsmi cPanel izahı: https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/

Domenə fayl yükləmək DNS, SSL və e-poçt hesabını özü yaratmır. `info@nordatech.az` ayrıca hostinq panelində açılmalıdır. İşləyən e-poçt qeydləri varsa MX, SPF, DKIM və DMARC-ni qoruyun.

Telefon/WhatsApp Business: +994 77 727 72 09. E-poçt: info@nordatech.az.
LinkedIn: https://www.linkedin.com/company/norda-tech
Instagram: https://www.instagram.com/nordatech.az/

## Məzmunun sərhədləri

Norda təchizat şirkəti kimi təqdim edilir. İnteqrasiya, quraşdırma və texniki xidmət iddia edilmir. Qiymət, mövcudluq, müddət, region, zəmanət və kommersiya şərtləri sorğu üzrə dəqiqləşdirilir. Brendlərin loqosu rəsmi tərəfdaşlıq və ya distribütorluq statusu demək deyil.

Məhsul şəkilləri AI illüstrasiyalarıdır; dəqiq stok/model fotosu kimi təqdim edilmir. Kassa aparatları və mobil əl terminalları istifadəçinin istəyi ilə çıxarılıb. Hüquqi ad, VÖEN, ofis ünvanı, sertifikat, rəylər və nailiyyət statistikası uydurulmayıb.

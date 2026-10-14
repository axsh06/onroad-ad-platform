export type LegalText = [ru: string, kk: string, en: string];
export type LegalSection = {
  id: string;
  title: LegalText;
  paragraphs?: LegalText[];
  items?: LegalText[];
  source?: { href: string; label: LegalText };
};

export const privacySections: LegalSection[] = [
  {
    id: "scope",
    title: ["О чём эта политика", "Бұл саясат не туралы", "About this policy"],
    paragraphs: [[
      "ONROAD помогает владельцам автомобилей и компаниям согласовывать размещение рекламы в Астане. Эта политика объясняет, какие сведения используются при регистрации, добавлении автомобиля, отправке заявки и работе в личном кабинете. Она относится к сайту onroad-ad-platform.vercel.app.",
      "ONROAD Астанада көлік иелері мен компанияларға жарнама орналастыруды келісуге көмектеседі. Бұл саясат тіркелу, көлік қосу, өтінім жіберу және жеке кабинетті пайдалану кезінде қандай мәліметтер қолданылатынын түсіндіреді. Ол onroad-ad-platform.vercel.app сайтына қатысты.",
      "ONROAD helps vehicle owners and companies arrange advertising placements in Astana. This policy explains the information used when registering, adding a vehicle, submitting a request and using an account. It applies to onroad-ad-platform.vercel.app.",
    ], [
      "Согласие на обработку данных запрашивается при регистрации; сохраняются дата и версия политики. Отдельное подтверждение запрашивается, когда компания хочет сообщить владельцу автомобиля о своём интересе.",
      "Деректерді өңдеуге келісім тіркелу кезінде сұралады; келісім күні мен саясат нұсқасы сақталады. Компания көлік иесіне қызығушылығы туралы хабарлағысы келгенде бөлек растау сұралады.",
      "Registration asks for consent to data processing and records its date and policy version. Separate confirmation is requested when a company wants to share its interest with a vehicle owner.",
    ]],
  },
  {
    id: "data",
    title: ["Какие данные используются", "Қандай деректер қолданылады", "Information we use"],
    items: [[
      "Аккаунт: имя, email, выбранная роль и язык; телефон, если он указан, и название компании для рекламодателя. Для входа хранится хеш пароля.",
      "Аккаунт: аты, email, таңдалған рөл мен тіл; көрсетілген болса телефон және жарнама берушінің компания атауы. Кіру үшін құпиясөздің хеші сақталады.",
      "Account: name, email, role and language; an optional phone number and the advertiser’s company name. A password hash is stored for sign-in.",
    ], [
      "Автомобиль: марка, модель, год, цвет, город, районы поездок, указанный пробег, фотографии, выбранные рекламные зоны и цены. При добавлении отдельной 3D-модели сохраняются файл и настройки зон.",
      "Көлік: маркасы, моделі, жылы, түсі, қаласы, жүретін аудандары, көрсетілген жүріс қашықтығы, фотосуреттері, жарнама аймақтары мен бағалары. Жеке 3D модель қосылғанда файл мен аймақ баптаулары сақталады.",
      "Vehicle: make, model, year, colour, city, travel districts, declared mileage, photos, advertising areas and prices. An assigned 3D model also includes its file and placement settings.",
    ], [
      "Обращения: заявки на размещение, выбранные даты и зоны, расчёт стоимости, отправленный макет, решения модератора и переписка по проверке автомобиля.",
      "Өтінімдер: орналастыру сұраулары, таңдалған күндер мен аймақтар, баға есебі, жіберілген макет, модератор шешімдері және көлікті тексеруге қатысты хат алмасу.",
      "Requests: placement applications, selected dates and areas, estimates, submitted artwork, moderation decisions and vehicle-review correspondence.",
    ], [
      "Технические сведения: данные сеанса, подтверждение email, время действий и счётчики попыток. IP-адрес и email используются для ограничения частоты запросов; ключи этих счётчиков хешируются.",
      "Техникалық мәліметтер: сеанс деректері, email растауы, әрекет уақыты және әрекеттер саны. IP мекенжайы мен email сұраулар жиілігін шектеу үшін қолданылады; есептегіш кілттері хештеледі.",
      "Technical information: session data, email verification, action timestamps and attempt counters. IP addresses and emails help limit request frequency; these counter keys are hashed.",
    ]],
  },
  {
    id: "purposes",
    title: ["Для чего нужны данные", "Деректер не үшін қажет", "Why information is needed"],
    paragraphs: [[
      "Данные используются для входа в аккаунт, связи по заявкам, проверки автомобилей, публикации одобренных карточек, расчёта кампании и учёта её статуса. Администратор видит сведения, необходимые для рассмотрения заявок и разрешения спорных ситуаций.",
      "Деректер аккаунтқа кіру, өтінімдер бойынша байланысу, көліктерді тексеру, мақұлданған карточкаларды жариялау, науқан құнын есептеу және мәртебесін жүргізу үшін қолданылады. Әкімші өтінімдерді қарау мен дауларды шешуге қажетті мәліметтерді көреді.",
      "Information is used for account access, request-related communication, vehicle review, approved listings, campaign estimates and status tracking. Administrators can access information needed to review requests and address disputes.",
    ], [
      "Письма с кодами и результатами модерации относятся к работе сервиса. Отправка зависит от доступности почтового сервиса. Согласие при регистрации не является подпиской на рекламную рассылку.",
      "Растау кодтары мен модерация нәтижелері бар хаттар сервис жұмысына қатысты. Олардың жіберілуі пошта сервисінің қолжетімділігіне байланысты. Тіркелу кезіндегі келісім жарнамалық таратуға жазылу болып саналмайды.",
      "Verification and moderation emails are service messages. Delivery depends on the email service being available. Registration consent is not a subscription to promotional emails.",
    ]],
  },
  {
    id: "visibility",
    title: ["Что видят другие пользователи", "Басқа пайдаланушылар не көреді", "What other users can see"],
    paragraphs: [[
      "После одобрения в каталоге доступны характеристики автомобиля, город и районы поездок, фотографии, рекламные зоны, цены и доступность. Каталог также может передавать имя и аватар владельца. Контактный email, телефон, отдельное поле госномера и комментарии модератора не публикуются в карточке.",
      "Мақұлданғаннан кейін каталогта көлік сипаттамалары, қала мен жүретін аудандар, фотосуреттер, жарнама аймақтары, бағалар және қолжетімділік көрсетіледі. Каталог иесінің аты мен аватарын да бере алады. Байланыс email-ы, телефон, мемлекеттік нөмірдің жеке өрісі және модератор пікірлері карточкада жарияланбайды.",
      "After approval, the catalog makes vehicle details, city, travel districts, photos, advertising areas, prices and availability accessible. Catalog data may also include the owner’s name and avatar. Contact email, phone, the separate registration-number field and moderation notes are not published on the listing.",
    ], [
      "До одобрения загруженные фотографии и модель доступны владельцу и администратору. Перед загрузкой уберите с фото документы, лица и другие сведения, которые не хотите публиковать: содержимое самого изображения не скрывается автоматически.",
      "Мақұлдауға дейін жүктелген фотосуреттер мен модель иесіне және әкімшіге қолжетімді. Жүктемес бұрын жариялағыңыз келмейтін құжаттарды, адамдардың жүздерін және басқа мәліметтерді суреттен алып тастаңыз: сурет мазмұны автоматты түрде жасырылмайды.",
      "Before approval, uploaded photos and models are accessible to their owner and administrators. Remove documents, faces and other information you do not want published before uploading: image content is not automatically obscured.",
    ], [
      "Компания, подтвердившая интерес к автомобилю, показывает владельцу своё название и дату обращения. Обычный просмотр карточки не создаёт такую запись. Владелец также видит компанию, имя представителя, даты и статус подтверждённого размещения на своём автомобиле.",
      "Көлікке қызығушылығын растаған компания иесіне өз атауы мен өтініш күнін көрсетеді. Карточканы жай қарау мұндай жазба жасамайды. Иесі өз көлігіндегі расталған орналастыру бойынша компанияны, өкілдің атын, күндер мен мәртебені де көреді.",
      "A company that confirms its interest shares its name and the request date with the owner. Simply viewing a listing does not create this record. Owners can also see the company, representative’s name, dates and status of confirmed placements on their vehicles.",
    ]],
  },
  {
    id: "studio",
    title: ["Файлы в студии примерки", "Сынау студиясындағы файлдар", "Files in the design studio"],
    paragraphs: [[
      "В разделе «Примерка» фотографии и наклейки обрабатываются в браузере. Выбор файла для 2D- или 3D-примерки сам по себе не отправляет его на сервер. Скачанный PNG сохраняется на вашем устройстве. После обновления или закрытия страницы несохранённый макет теряется.",
      "«Сынау» бөлімінде фотосуреттер мен жапсырмалар браузерде өңделеді. 2D немесе 3D сынау үшін файл таңдау оны серверге жібермейді. Жүктелген PNG құрылғыңызға сақталады. Бет жаңартылғанда немесе жабылғанда сақталмаған макет жоғалады.",
      "Photos and decals in the Design studio are processed in your browser. Selecting a file for 2D or 3D preview does not itself upload it to the server. Downloaded PNGs are saved to your device. Refreshing or leaving the page clears unsaved artwork.",
    ], [
      "Загрузка фотографий при добавлении автомобиля и отправка макета вместе с заявкой — отдельные действия: эти материалы сохраняются на сервере для рассмотрения и работы с размещением.",
      "Көлік қосқанда фотосуреттерді жүктеу және өтініммен бірге макет жіберу — бөлек әрекеттер: бұл материалдар қарау және орналастырумен жұмыс істеу үшін серверге сақталады.",
      "Uploading vehicle photos or submitting artwork with a placement request are separate actions: those materials are stored on the server for review and placement management.",
    ]],
  },
  {
    id: "cookies",
    title: ["Cookie и настройки браузера", "Cookie және браузер баптаулары", "Cookies and browser settings"],
    paragraphs: [[
      "Cookie onroad_locale хранит выбранный язык до одного года. Язык также записывается в localStorage для синхронизации вкладок. Служебные cookie авторизации поддерживают вход и защищают запросы. Их удаление может завершить сеанс и сбросить язык.",
      "onroad_locale cookie файлы таңдалған тілді бір жылға дейін сақтайды. Қойындыларды синхрондау үшін тіл localStorage-қа да жазылады. Авторизацияның қызметтік cookie файлдары кіруді қолдап, сұрауларды қорғайды. Оларды жою сеансты аяқтап, тіл баптауын қалпына келтіруі мүмкін.",
      "The onroad_locale cookie remembers your language for up to one year. The language is also stored in localStorage to sync tabs. Authentication cookies support sign-in and protect requests. Clearing them can end your session and reset your language.",
    ], [
      "При загрузке страниц браузер обращается к хостингу сайта и Google Fonts для отображения шрифтов. Эти поставщики получают технические данные запроса, в том числе IP-адрес. Настройки cookie и локальных данных можно изменить в браузере.",
      "Беттер ашылғанда браузер сайт хостингіне және қаріптерді көрсету үшін Google Fonts қызметіне сұрау жібереді. Бұл жеткізушілер сұраудың техникалық деректерін, соның ішінде IP мекенжайын алады. Cookie мен жергілікті деректер баптауларын браузерде өзгертуге болады.",
      "Loading pages sends requests to the site’s hosting provider and to Google Fonts for fonts. These providers receive technical request data, including your IP address. Cookie and local-data settings can be managed in your browser.",
    ]],
  },
  {
    id: "storage",
    title: ["Хранение и защита", "Сақтау және қорғау", "Storage and protection"],
    paragraphs: [[
      "Сайт размещён на Vercel, данные аккаунтов и заявок — в Neon PostgreSQL, загруженные файлы — в закрытом хранилище Vercel Blob с проверкой доступа через приложение. Эти облачные ресурсы находятся за пределами Казахстана; хранение базы персональных данных в Казахстане в текущей конфигурации не реализовано.",
      "Сайт Vercel-де, аккаунттар мен өтінімдер Neon PostgreSQL-де, ал жүктелген файлдар қолданба арқылы қолжетімділік тексерілетін жабық Vercel Blob қоймасында орналасқан. Бұл бұлт ресурстары Қазақстаннан тыс жерде; қазіргі конфигурацияда дербес деректер базасын Қазақстанда сақтау іске асырылмаған.",
      "Vercel hosts the site, Neon PostgreSQL stores account and request data, and private Vercel Blob storage holds uploaded files with access checked by the application. These cloud resources are outside Kazakhstan; the current configuration does not store the personal-data database in Kazakhstan.",
    ], [
      "Законодательство Казахстана предусматривает требования к локальному хранению и трансграничной передаче персональных данных. Согласие пользователя не заменяет выполнение этих требований.",
      "Қазақстан заңнамасы дербес деректерді жергілікті сақтау мен трансшекаралық беруге талаптар қояды. Пайдаланушы келісімі бұл талаптарды орындауды алмастырмайды.",
      "Kazakhstan law sets requirements for local storage and cross-border transfers of personal data. User consent does not replace compliance with those requirements.",
    ], [
      "Соединение с сайтом защищено HTTPS. Пароли и коды подтверждения хранятся в виде хешей; код действует 10 минут, число попыток ограничено. Доступ к непубличным материалам зависит от роли пользователя. Не передавайте другим пароль и одноразовые коды.",
      "Сайтпен байланыс HTTPS арқылы қорғалады. Құпиясөздер мен растау кодтары хеш түрінде сақталады; код 10 минут жарамды, әрекеттер саны шектелген. Жария емес материалдарға қолжетімділік пайдаланушы рөліне байланысты. Құпиясөз бен бір реттік кодтарды өзгелерге бермеңіз.",
      "The site uses HTTPS. Passwords and verification codes are stored as hashes; codes expire after 10 minutes and attempts are limited. Access to non-public materials depends on the user’s role. Do not share passwords or one-time codes.",
    ]],
    source: {
      href: "https://adilet.zan.kz/rus/docs/V2300032810",
      label: ["Правила защиты персональных данных РК", "ҚР дербес деректерді қорғау қағидалары", "Kazakhstan personal-data protection rules"],
    },
  },
  {
    id: "retention",
    title: ["Как долго сохраняются сведения", "Мәліметтер қанша уақыт сақталады", "How long information is kept"],
    paragraphs: [[
      "Аккаунт, материалы автомобиля и история заявок сохраняются в базе для работы кабинета и рассмотрения размещений. Истечение срока рекламной кампании само по себе не удаляет её историю. Автоматическое удаление неактивных аккаунтов и отдельная кнопка удаления профиля сейчас не предусмотрены.",
      "Аккаунт, көлік материалдары мен өтінімдер тарихы кабинет жұмысы және орналастыруларды қарау үшін базада сақталады. Жарнама науқанының аяқталуы оның тарихын өздігінен жоймайды. Белсенді емес аккаунттарды автоматты жою және профильді жоюға арналған бөлек батырма әзірге қарастырылмаған.",
      "Accounts, vehicle materials and request history remain in the database for account operation and placement management. A campaign ending does not automatically delete its history. Automatic removal of inactive accounts and a self-service account-deletion button are not currently available.",
    ], [
      "При рассмотрении запроса на удаление учитываются цели обработки, незавершённые обязательства и установленные законом сроки хранения. Удаление из базы сайта не удаляет копии публичных фотографий, которые другие пользователи уже сохранили на своих устройствах.",
      "Жою туралы өтінішті қарағанда өңдеу мақсаттары, орындалмаған міндеттемелер және заңда белгіленген сақтау мерзімдері ескеріледі. Сайт базасынан жою басқа пайдаланушылар өз құрылғыларына сақтап алған жария фотосуреттер көшірмелерін жоймайды.",
      "Deletion requests must account for processing purposes, outstanding obligations and legally required retention. Deleting data from the site does not remove public photos that other users have already saved to their devices.",
    ]],
  },
  {
    id: "rights",
    title: ["Ваши права и обращения", "Құқықтарыңыз және өтініштер", "Your rights and requests"],
    paragraphs: [[
      "Вы вправе запрашивать информацию об обработке своих данных, требовать исправления неточных сведений и в предусмотренных законом случаях — блокирования или удаления данных, а также отзывать согласие. Отзыв не отменяет обязанности по хранению, установленные законом, и учитывает неисполненные обязательства.",
      "Сіз деректеріңізді өңдеу туралы ақпарат сұрауға, қате мәліметтерді түзетуді және заңда көзделген жағдайларда деректерді бұғаттауды немесе жоюды талап етуге, сондай-ақ келісімді қайтарып алуға құқылысыз. Қайтарып алу заңда белгіленген сақтау міндеттерін жоймайды және орындалмаған міндеттемелерді ескереді.",
      "You may request information about data processing, correction of inaccurate information and, where the law provides, restriction or deletion, and may withdraw consent. Withdrawal remains subject to statutory retention duties and outstanding obligations.",
    ], [
      "В обращении укажите email аккаунта, автомобиль или заявку, к которым относится вопрос, и желаемое действие. Для защиты аккаунта может потребоваться подтверждение владения им. Не отправляйте пароль или код входа. Адрес для таких обращений приведён в разделе «Связь с ONROAD».",
      "Өтініште аккаунт email-ын, сұраққа қатысты көлікті немесе өтінімді және сұраған әрекетті көрсетіңіз. Аккаунтты қорғау үшін оған иелік етуді растау қажет болуы мүмкін. Құпиясөзді немесе кіру кодын жібермеңіз. Мұндай өтініштерге арналған мекенжай «ONROAD-пен байланыс» бөлімінде берілген.",
      "Include your account email, the relevant vehicle or request, and the action you are asking for. Account ownership may need to be confirmed to protect your information. Do not send passwords or sign-in codes. The address for requests is in the Contact ONROAD section.",
    ]],
    source: {
      href: "https://adilet.zan.kz/rus/docs/Z1300000094",
      label: ["Закон РК «О персональных данных и их защите»", "ҚР «Дербес деректер және оларды қорғау туралы» заңы", "Kazakhstan Law on Personal Data and their Protection"],
    },
  },
  {
    id: "changes",
    title: ["Обновления политики", "Саясатты жаңарту", "Policy updates"],
    paragraphs: [[
      "Дата редакции указана в начале страницы. При изменении состава данных, целей обработки или получателей политика обновляется. Публикация новой версии сама по себе не означает, что вы дали новое согласие; когда оно требуется, его необходимо получить отдельно.",
      "Нұсқа күні беттің басында көрсетілген. Деректер құрамы, өңдеу мақсаттары немесе алушылар өзгерсе, саясат жаңартылады. Жаңа нұсқаны жариялау жаңа келісім бергеніңізді білдірмейді; қажет болған жағдайда келісім бөлек алынуы тиіс.",
      "The revision date is shown at the top of this page. The policy is updated when information collected, purposes or recipients change. Publishing a new version does not itself create renewed consent; where required, consent must be obtained separately.",
    ]],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "service",
    title: ["Как работает ONROAD", "ONROAD қалай жұмыс істейді", "How ONROAD works"],
    paragraphs: [[
      "ONROAD — сервис подбора автомобилей для размещения рекламы. Владелец предлагает автомобиль и рекламные зоны, компания выбирает подходящий вариант и отправляет заявку, администратор проверяет материалы и помогает согласовать размещение. Доступный город — Астана; Алматы и Шымкент отмечены как будущие направления.",
      "ONROAD — жарнама орналастыру үшін көлік таңдау сервисі. Иесі көлігі мен жарнама аймақтарын ұсынады, компания қолайлы нұсқаны таңдап, өтінім жібереді, әкімші материалдарды тексеріп, орналастыруды келісуге көмектеседі. Қолжетімді қала — Астана; Алматы мен Шымкент кейін қосылатын бағыттар ретінде көрсетілген.",
      "ONROAD is a vehicle-advertising matching service. Owners offer vehicles and placement areas, companies select options and submit requests, and administrators review materials and help arrange placements. Astana is the active city; Almaty and Shymkent are listed as coming soon.",
    ], [
      "Эти условия описывают использование сайта. Конкретная рекламная кампания требует отдельного согласования сторонами. Просмотр каталога, расчёт бюджета или отправка заявки сами по себе не заключают договор на размещение рекламы.",
      "Бұл шарттар сайтты пайдалануды сипаттайды. Нақты жарнама науқаны тараптардың бөлек келісуін талап етеді. Каталогты қарау, бюджетті есептеу немесе өтінім жіберу жарнама орналастыру шартын өздігінен жасамайды.",
      "These terms describe use of the website. Each advertising campaign requires a separate agreement between its parties. Browsing listings, estimating a budget or submitting a request does not itself conclude an advertising-placement contract.",
    ]],
  },
  {
    id: "accounts",
    title: ["Аккаунт и регистрация", "Аккаунт және тіркелу", "Accounts and registration"],
    paragraphs: [[
      "Выберите роль владельца автомобиля или представителя компании. Указывайте достоверные сведения и email, к которому у вас есть доступ. Представитель компании должен иметь полномочия действовать от её имени, а владелец — право предлагать автомобиль для размещения.",
      "Көлік иесі немесе компания өкілі рөлін таңдаңыз. Шынайы мәліметтер мен өзіңіз кіре алатын email көрсетіңіз. Компания өкілі оның атынан әрекет етуге, ал көлік иесі көлікті орналастыру үшін ұсынуға құқылы болуы тиіс.",
      "Choose the vehicle-owner or company role. Provide accurate information and an email address you can access. Company representatives must be authorised to act for the company, and owners must have the right to offer their vehicles for advertising.",
    ], [
      "Для новых аккаунтов предусмотрено подтверждение email кодом. Если отправка писем недоступна, регистрация приостанавливается с сообщением на экране. Храните пароль и коды в тайне; действия в аккаунте должны выполняться его владельцем или уполномоченным представителем.",
      "Жаңа аккаунттар үшін email-ды кодпен растау қарастырылған. Хат жіберу қолжетімсіз болса, тіркелу тоқтатылып, экранда хабарлама көрсетіледі. Құпиясөз бен кодтарды құпия сақтаңыз; аккаунттағы әрекеттерді оның иесі немесе уәкілетті өкілі орындауы тиіс.",
      "New accounts require email verification by code. If email delivery is unavailable, registration is paused with an on-screen message. Keep passwords and codes private; account actions should be performed by the owner or an authorised representative.",
    ]],
  },
  {
    id: "moderation",
    title: ["Автомобиль и модерация", "Көлік және модерация", "Vehicles and moderation"],
    paragraphs: [[
      "Добавьте характеристики автомобиля, актуальные фотографии, районы поездок и доступные рекламные зоны. Отправленная карточка сначала поступает на ручную проверку. Администратор может одобрить её, запросить дополнительные сведения или отклонить с пояснением. После одобрения автомобиль появляется в каталоге и калькуляторе.",
      "Көлік сипаттамаларын, өзекті фотосуреттерін, жүретін аудандарын және қолжетімді жарнама аймақтарын қосыңыз. Жіберілген карточка алдымен қолмен тексеріледі. Әкімші оны мақұлдай алады, қосымша мәлімет сұрай алады немесе түсіндіріп қабылдамай алады. Мақұлданғаннан кейін көлік каталог пен калькуляторда пайда болады.",
      "Add vehicle details, current photos, travel districts and available advertising areas. Submitted listings go through manual review. Administrators may approve them, ask for more information or reject them with an explanation. Approved vehicles appear in the catalog and planner.",
    ], [
      "Решение и комментарий доступны в кабинете владельца. После запроса уточнений или отклонения можно дополнить материалы и отправить их повторно. Одобрение карточки не является техническим осмотром, оценкой автомобиля или обещанием дохода.",
      "Шешім мен пікір иесінің кабинетінде қолжетімді. Нақтылау сұралғаннан немесе өтінім қабылданбағаннан кейін материалдарды толықтырып, қайта жіберуге болады. Карточканы мақұлдау техникалық байқау, көлікті бағалау немесе табысқа кепілдік болып саналмайды.",
      "Decisions and comments are available in the owner’s account. Materials can be supplemented and resubmitted after a request for information or rejection. Listing approval is not a vehicle inspection, appraisal or earnings promise.",
    ]],
  },
  {
    id: "requests",
    title: ["Выбор автомобиля и заявка", "Көлік таңдау және өтінім", "Choosing a vehicle and requesting placement"],
    paragraphs: [[
      "Компания выбирает автомобиль, зону, дату начала и срок размещения. Калькулятор использует цены доступных зон одобренных автомобилей. Отправленная заявка получает статус рассмотрения: это ещё не подтверждённая бронь. Доступность выбранных дат уточняется при согласовании.",
      "Компания көлікті, аймақты, басталу күнін және орналастыру мерзімін таңдайды. Калькулятор мақұлданған көліктердегі қолжетімді аймақтардың бағаларын қолданады. Жіберілген өтінім қаралу мәртебесін алады: бұл әлі расталған бронь емес. Таңдалған күндердің қолжетімділігі келісу кезінде нақтыланады.",
      "Companies select a vehicle, area, start date and duration. The planner uses available-area prices from approved vehicles. Submitted requests await review and are not yet confirmed reservations. Availability for the selected dates is checked during agreement.",
    ], [
      "До начала кампании стороны письменно согласуют автомобиль и зоны, макет, размеры и материал наклейки, сроки, стоимость, выплату владельцу, монтаж, демонтаж и ответственность за повреждения. Подтверждённые размещения учитываются в доступности автомобиля.",
      "Науқан басталғанға дейін тараптар көлік пен аймақтарды, макетті, жапсырма өлшемі мен материалын, мерзімді, құнды, иесіне төлемді, орнатуды, алып тастауды және зақымдарға жауапкершілікті жазбаша келіседі. Расталған орналастырулар көліктің қолжетімділігінде ескеріледі.",
      "Before a campaign starts, the parties agree in writing on the vehicle and areas, artwork, decal size and material, dates, price, owner’s payment, installation, removal and damage responsibility. Confirmed placements affect vehicle availability.",
    ]],
  },
  {
    id: "prices",
    title: ["Стоимость, оплата и отмена", "Құн, төлем және бас тарту", "Pricing, payment and cancellation"],
    paragraphs: [[
      "Цены указываются в тенге. Сумма в калькуляторе — предварительный расчёт по выбранным параметрам. Стоимость изготовления наклейки, монтажа, демонтажа и дополнительных работ согласуется отдельно, если прямо не включена в предложение.",
      "Бағалар теңгемен көрсетіледі. Калькулятордағы сома — таңдалған параметрлер бойынша алдын ала есеп. Жапсырма дайындау, орнату, алып тастау және қосымша жұмыс құны ұсынысқа тікелей енгізілмесе, бөлек келісіледі.",
      "Prices are shown in tenge. Planner totals are preliminary estimates based on selected options. Decal production, installation, removal and other work are agreed separately unless expressly included in the offer.",
    ], [
      "Онлайн-оплата на сайте сейчас не подключена: отправка заявки не списывает деньги, данные банковской карты не запрашиваются. Порядок оплаты, комиссия, сроки выплат владельцу, условия переноса, отмены и возврата средств определяются договором конкретной кампании до её запуска.",
      "Сайттағы онлайн төлем әзірге қосылмаған: өтінім жіберу ақша алмайды, банк картасының деректері сұралмайды. Төлем тәртібі, комиссия, иесіне төлем мерзімі, ауыстыру, бас тарту және қаражат қайтару шарттары нақты науқан шартында іске қосылғанға дейін белгіленеді.",
      "Online payment is not currently connected: submitting a request does not charge money or ask for card details. Payment methods, fees, owner payout dates, rescheduling, cancellation and refunds are set out in the individual campaign agreement before launch.",
    ]],
  },
  {
    id: "mockups",
    title: ["2D- и 3D-примерка наклеек", "Жапсырмаларды 2D және 3D сынау", "2D and 3D decal previews"],
    paragraphs: [[
      "Студия позволяет загрузить логотип, выбрать поверхность, изменить положение, размер, поворот и прозрачность наклейки, затем скачать изображение. Фотографии и модели в студии служат для визуальной примерки и не означают, что такой автомобиль доступен для заказа. Реальные предложения находятся в каталоге.",
      "Студия логотип жүктеуге, бетті таңдауға, жапсырманың орнын, өлшемін, бұрылуын және мөлдірлігін өзгертіп, суретті жүктеуге мүмкіндік береді. Студиядағы фотосуреттер мен модельдер көрнекі сынауға арналған және мұндай көлікке тапсырыс беруге болатынын білдірмейді. Нақты ұсыныстар каталогта орналасқан.",
      "The studio lets you upload a logo, select a surface, adjust decal position, size, rotation and opacity, and download an image. Studio photos and models are visual references and do not imply that the pictured vehicle is available to book. Actual offers appear in the catalog.",
    ], [
      "Макет не является файлом для печати в натуральную величину и не заменяет замеры конкретного автомобиля. Заднее стекло доступно в примерке, но не входит в стандартные зоны бронирования: его пригодность, материал и безопасность необходимо согласовать отдельно. Скачайте результат перед закрытием страницы — студия не сохраняет его в аккаунте автоматически.",
      "Макет нақты өлшемдегі баспа файлы емес және нақты көлікті өлшеуді алмастырмайды. Артқы әйнек сынауда қолжетімді, бірақ стандартты бронь аймақтарына кірмейді: жарамдылығы, материалы мен қауіпсіздігі бөлек келісілуі тиіс. Бетті жаппас бұрын нәтижені жүктеңіз — студия оны аккаунтқа автоматты сақтамайды.",
      "A mockup is not a full-size print file and does not replace measurements of the actual vehicle. The rear window can be previewed but is not a standard bookable area; suitability, material and safety require separate agreement. Download your design before leaving: the studio does not automatically save it to your account.",
    ]],
  },
  {
    id: "materials",
    title: ["Материалы и права на них", "Материалдар және оларға құқықтар", "Materials and usage rights"],
    paragraphs: [[
      "Загружайте только материалы, которые вправе использовать: фотографии, логотипы, тексты и 3D-модели. Не размещайте чужие персональные данные без основания. Материалы не должны нарушать законодательство, права третьих лиц или содержать вводящую в заблуждение рекламу.",
      "Пайдалануға құқығыңыз бар материалдарды ғана жүктеңіз: фотосуреттер, логотиптер, мәтіндер мен 3D модельдер. Өзге адамдардың дербес деректерін негізсіз жарияламаңыз. Материалдар заңнаманы, үшінші тұлғалардың құқықтарын бұзбауы және жаңылыстыратын жарнама қамтымауы тиіс.",
      "Upload only photos, logos, text and 3D models you are entitled to use. Do not publish other people’s personal information without a valid basis. Materials must not violate the law, infringe third-party rights or contain misleading advertising.",
    ], [
      "Отправляя автомобиль на публикацию или макет на согласование, вы разрешаете использовать материалы для рассмотрения заявки, показа одобренной карточки и работы с вашим размещением. Авторские права сохраняются у правообладателей. Указанные для сторонних моделей лицензии и требования об авторстве продолжают действовать.",
      "Көлікті жариялауға немесе макетті келісуге жіберу арқылы материалдарды өтінімді қарау, мақұлданған карточканы көрсету және орналастырумен жұмыс істеу үшін пайдалануға рұқсат бересіз. Авторлық құқықтар құқық иелерінде қалады. Үшінші тарап модельдерінің лицензиялары мен авторды көрсету талаптары күшінде қалады.",
      "Submitting a vehicle for publication or artwork for approval permits its use to review the request, display the approved listing and manage your placement. Copyright remains with its holders. Third-party model licences and attribution requirements continue to apply.",
    ]],
  },
  {
    id: "installation",
    title: ["Монтаж и безопасность", "Орнату және қауіпсіздік", "Installation and safety"],
    paragraphs: [[
      "Реклама на транспортном средстве размещается по договорённости с его собственником или иным уполномоченным лицом с соблюдением требований безопасности дорожного движения. До монтажа проверяются содержание рекламы, выбранная поверхность и допустимость размещения на конкретном автомобиле.",
      "Көліктегі жарнама оның меншік иесімен немесе өзге уәкілетті тұлғамен келісім бойынша, жол қозғалысы қауіпсіздігі талаптарын сақтай отырып орналастырылады. Орнатуға дейін жарнама мазмұны, таңдалған бет және нақты көлікте орналастыруға болатыны тексеріледі.",
      "Vehicle advertising requires agreement with its owner or another authorised party and compliance with road-safety requirements. Advertising content, the selected surface and suitability for the particular vehicle must be checked before installation.",
    ], [
      "Наклейки не должны закрывать регистрационные знаки, световые приборы и необходимые для управления зоны обзора. Перед оклейкой стороны фиксируют состояние поверхности и согласуют исполнителя, уход за плёнкой и порядок снятия. Изображение в студии само по себе не подтверждает безопасность монтажа.",
      "Жапсырмалар мемлекеттік нөмірлерді, жарық аспаптарын және басқаруға қажетті көру аймақтарын жаппауы тиіс. Жапсыру алдында тараптар бет күйін тіркеп, орындаушыны, пленка күтімін және алып тастау тәртібін келіседі. Студиядағы сурет орнатудың қауіпсіздігін өздігінен растамайды.",
      "Decals must not obstruct registration plates, lights or visibility needed for driving. Before installation, the parties record the surface condition and agree on the installer, film care and removal. A studio image does not itself establish that installation is safe.",
    ]],
    source: {
      href: "https://adilet.zan.kz/rus/docs/Z030000508_",
      label: ["Закон РК «О рекламе», статья 12", "ҚР «Жарнама туралы» заңы, 12-бап", "Kazakhstan Law on Advertising, Article 12"],
    },
  },
  {
    id: "responsibility",
    title: ["Ответственность и доступность сервиса", "Жауапкершілік және сервистің қолжетімділігі", "Responsibilities and service availability"],
    paragraphs: [[
      "Пользователь отвечает за достоверность предоставленных сведений и права на материалы. Не допускаются спам, выдача себя за другого человека, попытки получить доступ к чужому кабинету и вмешательство в работу сайта. Нарушающие правила материалы могут быть отклонены или сняты с публикации.",
      "Пайдаланушы берген мәліметтердің дұрыстығы мен материалдарға құқықтары үшін жауап береді. Спамға, басқа адамның атынан әрекет етуге, бөтен кабинетке кіруге тырысуға және сайт жұмысына араласуға жол берілмейді. Ережелерді бұзатын материалдар қабылданбауы немесе жарияланымнан алынуы мүмкін.",
      "Users are responsible for the accuracy of their information and their rights to materials. Spam, impersonation, attempts to access other accounts and interference with the site are prohibited. Materials that violate these rules may be rejected or unpublished.",
    ], [
      "ONROAD не гарантирует конкретное число просмотров рекламы, клиентов, заказов или доход владельца. Пробег и районы поездок основаны на предоставленных сведениях. При техническом сбое сверяйте статус в кабинете до повторной отправки заявки. Эти условия не исключают ответственность и права, которые нельзя ограничить по закону.",
      "ONROAD жарнаманы көрудің, клиенттердің, тапсырыстардың нақты санына немесе иесінің табысына кепілдік бермейді. Жүріс қашықтығы мен аудандар берілген мәліметтерге негізделеді. Техникалық ақау кезінде өтінімді қайта жібермес бұрын кабинеттегі мәртебені тексеріңіз. Бұл шарттар заңмен шектеуге болмайтын жауапкершілік пен құқықтарды жоққа шығармайды.",
      "ONROAD does not guarantee a specific number of ad views, customers, orders or owner earnings. Mileage and travel districts rely on submitted information. If a technical problem occurs, check your account status before resubmitting a request. These terms do not exclude responsibilities or rights that cannot legally be limited.",
    ]],
  },
  {
    id: "updates",
    title: ["Изменения и спорные вопросы", "Өзгерістер және даулы мәселелер", "Changes and disputes"],
    paragraphs: [[
      "Актуальная редакция условий опубликована на этой странице. Изменения сайта не пересматривают автоматически уже согласованные договоры кампаний. При споре укажите номер заявки, автомобиль, даты и суть вопроса; сохраняйте согласованный макет и переписку. Неурегулированные разногласия разрешаются в порядке, предусмотренном законодательством Казахстана.",
      "Шарттардың өзекті нұсқасы осы бетте жарияланған. Сайттағы өзгерістер келісілген науқан шарттарын автоматты өзгертпейді. Дау туындаса, өтінім нөмірін, көлікті, күндерді және мәселенің мәнін көрсетіңіз; келісілген макет пен хат алмасуды сақтаңыз. Шешілмеген келіспеушіліктер Қазақстан заңнамасында көзделген тәртіппен шешіледі.",
      "The current terms are published on this page. Website changes do not automatically revise agreed campaign contracts. For disputes, identify the request, vehicle, dates and issue, and retain agreed artwork and correspondence. Unresolved disputes are handled under the procedures provided by Kazakhstan law.",
    ]],
  },
];

"use client";
import { Header, Footer } from "./Shell";
import { useLocale } from "./Locale";
export function LegalPage({ privacy = false }: { privacy?: boolean }) {
  const { t } = useLocale();
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap" style={{ maxWidth: 800 }}>
        <p className="eyebrow">ONROAD / ASTANA, KZ</p>
        <h1>
          {privacy
            ? t(
                "Обработка персональных данных",
                "Дербес деректерді өңдеу",
                "Personal data processing",
              )
            : t("Условия использования", "Пайдалану шарттары", "Terms of use")}
        </h1>
        <div className="form-stack" style={{ marginTop: 35 }}>
          <p className="form-notice">
            {t(
              "Прототип для тестирования. Текст требует дополнения реквизитами оператора и юридической проверки перед коммерческим запуском.",
              "Сынаққа арналған прототип. Коммерциялық іске қосу алдында оператор деректері қосылып, мәтін заңгермен тексерілуі керек.",
              "Testing prototype. Operator details and legal review are required before a commercial launch.",
            )}
          </p>
          {privacy ? (
            <>
              <p>
                {t(
                  "ONROAD обрабатывает имя, email, телефон, название компании, данные автомобиля и фотографии для создания аккаунта, проверки заявки и согласования размещения. Пароль хранится в виде хеша; одноразовый код имеет ограниченный срок и количество попыток.",
                  "ONROAD аккаунт жасау, өтінімді тексеру және орналастыруды келісу үшін атын, email, телефон, компания атауын, автомобиль деректері мен фотосуреттерді өңдейді. Құпиясөз хеш түрінде сақталады; бір реттік кодтың мерзімі мен әрекет саны шектелген.",
                  "ONROAD processes names, email addresses, phone numbers, company names, vehicle details and photos to create accounts, review applications and arrange placements. Passwords are hashed; one-time codes expire and have attempt limits.",
                )}
              </p>
              <p>
                {t(
                  "Фотографии автомобиля публикуются после одобрения. Контактный email и телефон не показываются в публичной карточке. При явном подтверждении интереса компания разрешает показать владельцу своё название и дату обращения.",
                  "Автомобиль фотосуреттері мақұлданғаннан кейін жарияланады. Email мен телефон ашық карточкада көрсетілмейді. Қызығушылықты нақты растағанда компания иесіне атауы мен хабарласу күнін көрсетуге рұқсат береді.",
                  "Vehicle photos are published after approval. Contact email addresses and phone numbers are not shown on public cards. When explicitly expressing interest, companies allow owners to see their name and the date.",
                )}
              </p>
              <p>
                {t(
                  "Прототип использует Vercel для сайта, Neon для базы данных и Vercel Blob для файлов. Облачные ресурсы находятся за пределами Казахстана. Для коммерческого запуска необходимо отдельно проверить требования к хранению и передаче персональных данных и выбрать подходящую инфраструктуру.",
                  "Прототип сайт үшін Vercel, дерекқор үшін Neon және файлдар үшін Vercel Blob қолданады. Бұлт ресурстары Қазақстаннан тыс орналасқан. Коммерциялық іске қосу үшін деректерді сақтау және беру талаптарын бөлек тексеріп, тиісті инфрақұрылымды таңдау керек.",
                  "The prototype uses Vercel hosting, Neon database and Vercel Blob file storage, located outside Kazakhstan. Data storage and transfer requirements must be reviewed and suitable infrastructure selected before commercial launch.",
                )}
              </p>
              <p>
                {t(
                  "Язык сохраняется в cookie. Название и контакты оператора, сроки хранения, порядок отзыва согласия и удаления данных должны быть добавлены до коммерческого запуска.",
                  "Тіл cookie файлында сақталады. Оператордың атауы мен байланысы, сақтау мерзімі, келісімді қайтарып алу және деректерді жою тәртібі коммерциялық іске қосуға дейін қосылуы керек.",
                  "Your language is saved in a cookie. Operator contact details, retention periods, consent withdrawal and deletion procedures must be added before commercial launch.",
                )}
              </p>
            </>
          ) : (
            <>
              <p>
                {t(
                  "ONROAD соединяет компании и владельцев автомобилей. Заявка на сайте не заключает договор, не списывает деньги и не гарантирует одобрение размещения.",
                  "ONROAD компаниялар мен автомобиль иелерін байланыстырады. Сайттағы өтінім шарт жасамайды, ақша алмайды және орналастыруды мақұлдауға кепілдік бермейді.",
                  "ONROAD connects companies with vehicle owners. A website request does not create a contract, charge money or guarantee placement approval.",
                )}
              </p>
              <p>
                {t(
                  "До размещения стороны письменно согласуют права на автомобиль и макет, зоны, сроки, цену, выплаты, монтаж, демонтаж и ответственность за возможные повреждения.",
                  "Орналастыру алдында тараптар автомобиль мен макетке құқықтарды, аймақтарды, мерзімді, бағаны, төлемдерді, орнатуды, алып тастауды және зақымдарға жауапкершілікті жазбаша келіседі.",
                  "Before placement, the parties agree in writing on vehicle and artwork rights, placements, duration, price, payouts, installation, removal and liability for damage.",
                )}
              </p>
              <p>
                {t(
                  "Цены в карточках и калькуляторе предварительные. 3D-модель и макет на фотографии служат для обсуждения, не заменяют замеры и проверку безопасности. Стекло не включено в стандартные зоны.",
                  "Карточка мен калькулятордағы бағалар алдын ала берілген. 3D модель мен фотомакет талқылауға арналған, өлшеу мен қауіпсіздік тексеруін алмастырмайды. Әйнек стандартты аймақтарға кірмейді.",
                  "Listing and planner prices are estimates. 3D models and photo mockups support discussion and do not replace measurements or safety checks. Windows are not standard placements.",
                )}
              </p>
              <p>
                {t(
                  "Содержание рекламы проверяется по законодательству Казахстана. Пользователь должен иметь права на фотографии, 3D-модели, логотипы и другие загружаемые материалы.",
                  "Жарнама мазмұны Қазақстан заңнамасына сай тексеріледі. Пайдаланушы жүктелетін фотосуреттерге, 3D модельдерге, логотиптерге және басқа материалдарға құқық иеленуі керек.",
                  "Advertising is reviewed under Kazakhstan law. Users must hold the rights to photos, 3D models, logos and other uploaded materials.",
                )}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

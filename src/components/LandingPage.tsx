import React from 'react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800/95 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-yellow-500 font-bold text-xl">AKTIVITETSLOGG.no</div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-300 hover:text-yellow-500 transition-colors">Funksjoner</a>
              <a href="#benefits" className="text-gray-300 hover:text-yellow-500 transition-colors">Fordeler</a>
              <a href="#pricing" className="text-gray-300 hover:text-yellow-500 transition-colors">Priser</a>
              <a href="#contact" className="text-gray-300 hover:text-yellow-500 transition-colors">Kontakt</a>
              <a href="mailto:yngve@promonorge.no" className="bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                Få demo
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                <span className="text-yellow-500">AKTIVITETSLOGG</span><span className="text-white">.no</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
                Digital treningsregistrering for <span className="text-yellow-500 font-semibold">skytterlag</span> og <span className="text-yellow-500 font-semibold">idrettslag</span>
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
                Slutt med papirbaserte lister og manuelle systemer. AKTIVITETSLOGG gir deg en komplett digital løsning 
                for å registrere, administrere og dokumentere treningsaktivitet - alt i ett system.
              </p>
            </div>
            
            {/* Key Selling Point - No App Required */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/50 rounded-2xl p-8 mb-12">
              <div className="text-5xl mb-4">
                <svg className="w-16 h-16 mx-auto text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16z"/>
                  <circle cx="12" cy="17" r="1"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">INGEN APP-INSTALLASJON NØDVENDIG!</h2>
              <p className="text-lg text-gray-300 mb-4">
                Alle med smartphone kan bruke AKTIVITETSLOGG direkte i nettleseren
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="text-green-400 text-2xl">✅</div>
                  <span>Registrer deg selv første gang</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-green-400 text-2xl">✅</div>
                  <span>Skann QR-kode på veggen</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-green-400 text-2xl">✅</div>
                  <span>Fungerer på alle telefoner</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-green-400 text-2xl">✅</div>
                  <span>Automatisk registrering</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a href="mailto:yngve@promonorge.no" className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:-translate-y-1">
                🚀 Få gratis demo
              </a>
              <a href="#features" className="border-2 border-yellow-500 text-yellow-500 px-8 py-4 rounded-xl text-lg hover:bg-yellow-500 hover:text-gray-900 transition-all">
                Se funksjoner
              </a>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-yellow-500 text-3xl mb-2">⚡</div>
                <div className="text-sm text-gray-400">Rask registrering med QR-koder</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-500 text-3xl mb-2">📱</div>
                <div className="text-sm text-gray-400">Ingen app-installasjon nødvendig</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-500 text-3xl mb-2">🔒</div>
                <div className="text-sm text-gray-400">Sikker og GDPR-kompatibel</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Sliter dere med <span className="text-red-400">disse utfordringene</span>?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                <div className="text-red-400 text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-3 text-red-400">Papirbaserte lister</h3>
                <p className="text-gray-300">Håndskrevne lister som forsvinner, blir ødelagt eller er vanskelige å lese</p>
              </div>
              
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                <div className="text-red-400 text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-3 text-red-400">Tidkrevende administrasjon</h3>
                <p className="text-gray-300">Timer med manuell databehandling og rapportgenerering</p>
              </div>
              
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                <div className="text-red-400 text-4xl mb-4">❌</div>
                <h3 className="text-xl font-semibold mb-3 text-red-400">Hva om skytedagboken forsvinner?</h3>
                <p className="text-gray-300">Hvordan skal dere da få hentet ut dokumentasjon til skyttere som ønsker å søke om våpenlisens? Alt arbeid er borte!</p>
              </div>
              
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                <div className="text-red-400 text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-3 text-red-400">Dyre medlemskort som forsvinner</h3>
                <p className="text-gray-300">Du slipper å trykke opp dyre medlemskort på papir eller tungvinte magnetstripe plastkort som forsvinner og må administreres</p>
              </div>
              
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                <div className="text-red-400 text-4xl mb-4">🚫</div>
                <h3 className="text-xl font-semibold mb-3 text-red-400">Manglende dokumentasjon for våpensøknader</h3>
                <p className="text-gray-300">Medlemmene kan ikke selv hente ut full logg over sine oppmøtte treninger for bruk i søknadsprosessen for kjøp av våpen eller våpendeler</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              <span className="text-yellow-500">AKTIVITETSLOGG</span> løser alle disse problemene
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              En komplett digital løsning som gjør treningsregistrering enkelt, sikkert og effektivt
            </p>
            
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-4">Så enkelt som 1-2-3</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-500 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Registrer deg selv</h4>
                    <p className="text-sm text-gray-400">Første gang: Registrer deg direkte i nettleseren</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-500 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Skann QR-kode</h4>
                    <p className="text-sm text-gray-400">Skann QR-koden på veggen når du kommer på trening</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-500 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Ferdig!</h4>
                    <p className="text-sm text-gray-400">Automatisk registrering - ingen mer papirarbeid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No App Required Section */}
      <section className="py-20 bg-green-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                <span className="text-green-400">INGEN APP</span> å installere!
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Medlemmene bruker bare sin vanlige nettleser på telefonen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">1</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-400">Første gang: Selvregistrering</h3>
                    <p className="text-gray-300">Medlemmet går til nettsiden på telefonen og registrerer seg selv med navn, e-post og medlemsnummer</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-400">Admin godkjenner</h3>
                    <p className="text-gray-300">Standplassleder eller admin godkjenner det nye medlemmet med ett klikk</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">3</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-400">Skann og ferdig!</h3>
                    <p className="text-gray-300">Fra nå av: Bare skann QR-koden på veggen hver gang du kommer på trening</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-6xl mb-6">📱</div>
                  <h3 className="text-2xl font-bold text-green-400 mb-4">Fungerer på ALLE telefoner</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">✅</div>
                      <span>iPhone og Android</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">✅</div>
                      <span>Gamle og nye telefoner</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">✅</div>
                      <span>Tablet og PC også</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">✅</div>
                      <span>Ingen nedlasting</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">✅</div>
                      <span>Ingen oppdateringer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Kraftige funksjoner som <span className="text-yellow-500">forenkler hverdagen</span>
              </h2>
              <p className="text-xl text-gray-300">Alt dere trenger for effektiv treningsadministrasjon</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* QR Scanner */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-3">QR-kode Skanning</h3>
                <p className="text-gray-300 mb-4">
                  Medlemmer registrerer oppmøte ved å skanne QR-kode på skytebanen. 
                  Rask, enkelt og feilfritt.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Fungerer på alle mobiler</li>
                  <li>✓ Automatisk tidsstempel</li>
                  <li>✓ Ingen app-nedlasting nødvendig</li>
                </ul>
              </div>

              {/* Admin Dashboard */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">👨‍💼</div>
                <h3 className="text-xl font-semibold mb-3">Admin Dashboard</h3>
                <p className="text-gray-300 mb-4">
                  Komplett administrasjonspanel for standplassledere og klubbadministratorer.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Godkjenn treningsøkter</li>
                  <li>✓ Administrer medlemmer</li>
                  <li>✓ Generer rapporter</li>
                </ul>
              </div>

              {/* Training Log */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3">Digital Treningslogg</h3>
                <p className="text-gray-300 mb-4">
                  Automatisk generering av treningslogger som kan brukes til våpensøknader.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ PDF-eksport</li>
                  <li>✓ Politigodkjent format</li>
                  <li>✓ Automatisk beregning</li>
                </ul>
              </div>

              {/* Member Management */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-3">Medlemsadministrasjon</h3>
                <p className="text-gray-300 mb-4">
                  Enkelt system for å administrere medlemmer, roller og tilganger.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Automatisk registrering</li>
                  <li>✓ Godkjenningsworkflow</li>
                  <li>✓ Rollebasert tilgang</li>
                </ul>
              </div>

              {/* Multi-tenant */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold mb-3">Multi-organisasjon</h3>
                <p className="text-gray-300 mb-4">
                  Støtter flere organisasjoner i samme system med egne innstillinger.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Egne fargetemaer</li>
                  <li>✓ Tilpassede logoer</li>
                  <li>✓ Separate databaser</li>
                </ul>
              </div>

              {/* Security */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-yellow-500 text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3">Sikkerhet & Personvern</h3>
                <p className="text-gray-300 mb-4">
                  Bygget med sikkerhet i fokus og fullt GDPR-kompatibelt.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Krypterte data</li>
                  <li>✓ GDPR-kompatibel</li>
                  <li>✓ Norske servere</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Hvorfor velge <span className="text-yellow-500">AKTIVITETSLOGG</span>?
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">⏱️</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Spar 90% av tiden</h3>
                    <p className="text-gray-300">Fra timevis manuelt arbeid til sekunder med automatisering</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">📈</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Bedre oversikt</h3>
                    <p className="text-gray-300">Få verdifull innsikt i medlemsaktivitet og trender</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">✅</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Myndighetsgodkjent</h3>
                    <p className="text-gray-300">Generer dokumentasjon som godkjennes av politiet for våpensøknader</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">🎯</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Spesialtilpasset</h3>
                    <p className="text-gray-300">Utviklet spesielt for norske skytterlag og idrettslag</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">🎫</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Slutt med medlemskort</h3>
                    <p className="text-gray-300">Du slipper alt ekstraarbeid rundt medlemskort som blir borte</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-6xl mb-6">🏆</div>
                  <h3 className="text-2xl font-bold text-yellow-500 mb-4">Allerede i bruk hos</h3>
                  <div className="space-y-3">
                    <div className="font-semibold">Svolvær Pistolklubb</div>
                    <p className="text-gray-400 text-sm">
                      "AKTIVITETSLOGG har revolusjonert måten vi administrerer treningsaktivitet på. 
                      Fra kaos til kontroll på få minutter!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Enkle og <span className="text-yellow-500">forutsigbare priser</span>
              </h2>
              <p className="text-xl text-gray-300">Ingen skjulte kostnader eller overraskelser</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Starter Plan */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Starter</h3>
                  <p className="text-gray-400 mb-4">Perfekt for mindre klubber</p>
                  <div className="text-4xl font-bold text-yellow-500 mb-2">
                    Kr 299<span className="text-lg text-gray-400">/mnd</span>
                  </div>
                  <p className="text-sm text-gray-400">Opp til 50 medlemmer</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>QR-kode registrering</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Medlemsadministrasjon</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>PDF-rapporter</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>E-post support</span>
                  </li>
                </ul>
                
                <a href="mailto:yngve@promonorge.no?subject=Interessert i AKTIVLOGG Starter" className="bg-yellow-500 text-gray-900 w-full py-3 rounded-xl text-center block font-semibold hover:bg-yellow-400 transition-colors">
                  Velg Starter
                </a>
              </div>

              {/* Professional Plan */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500 rounded-2xl p-8 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                    MEST POPULÆR
                  </span>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Professional</h3>
                  <p className="text-gray-400 mb-4">For større klubber og organisasjoner</p>
                  <div className="text-4xl font-bold text-yellow-500 mb-2">
                    Kr 599<span className="text-lg text-gray-400">/mnd</span>
                  </div>
                  <p className="text-sm text-gray-400">Ubegrenset medlemmer</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Alt fra Starter</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Ubegrenset medlemmer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Avanserte rapporter</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Tilpasset branding</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Prioritert support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="text-green-400">✓</div>
                    <span>Telefon support</span>
                  </li>
                </ul>
                
                <a href="mailto:yngve@promonorge.no?subject=Interessert i AKTIVLOGG Professional" className="bg-yellow-500 text-gray-900 w-full py-3 rounded-xl text-center block font-semibold hover:bg-yellow-400 transition-colors">
                  Velg Professional
                </a>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-400 mb-4">
                🎁 <strong>Spesialtilbud:</strong> Første måned gratis for alle nye kunder!
              </p>
              <p className="text-sm text-gray-500">
                Alle priser er eks. mva. Ingen bindingstid. Avbestill når som helst.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Se <span className="text-yellow-500">AKTIVLOGG</span> i aksjon
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Book en gratis demo og se hvordan AKTIVLOGG kan transformere deres treningsadministrasjon
            </p>
            
            <div className="bg-gray-800 border border-yellow-500/30 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-yellow-500 text-3xl mb-2">15</div>
                  <div className="text-sm text-gray-400">minutter demo</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-500 text-3xl mb-2">0</div>
                  <div className="text-sm text-gray-400">kroner kostnad</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-500 text-3xl mb-2">∞</div>
                  <div className="text-sm text-gray-400">spørsmål velkommen</div>
                </div>
              </div>
              
              <a href="mailto:yngve@promonorge.no?subject=Ønsker demo av AKTIVLOGG&body=Hei!%0A%0AVi er interessert i en demo av AKTIVLOGG for vårt lag.%0A%0AKlubbens navn: %0AAntall medlemmer: %0AKontaktperson: %0ATelefon: %0A%0ATakk!" 
                 className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl text-lg inline-block font-semibold hover:bg-yellow-400 transition-colors">
                📅 Book gratis demo nå
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Ofte stilte <span className="text-yellow-500">spørsmål</span>
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-500">Hvor lang tid tar det å komme i gang?</h3>
                <p className="text-gray-300">
                  AKTIVITETSLOGG kan være oppe og kjøre på under 30 minutter. Vi setter opp systemet for dere 
                  og gir opplæring til administratorer.
                </p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-500">Kan vi tilpasse systemet til våre behov?</h3>
                <p className="text-gray-300">
                  Ja! AKTIVITETSLOGG kan tilpasses med deres logo, farger og spesifikke krav. 
                  Vi jobber tett med hver kunde for å sikre perfekt tilpasning.
                </p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-500">Er dataene våre sikre?</h3>
                <p className="text-gray-300">
                  Absolutt. AKTIVITETSLOGG bruker moderne sikkerhetsteknologi, krypterte databaser 
                  og er fullt GDPR-kompatibelt. Alle data lagres på norske servere.
                </p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-500">Må medlemmene laste ned en app?</h3>
                <p className="text-gray-300">
                  <strong>NEI!</strong> AKTIVITETSLOGG fungerer direkte i nettleseren på alle telefoner. Ingen app-installasjon, 
                  ingen oppdateringer, ingen problemer. Bare gå til nettsiden og skann QR-koden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-orange-500">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900">
              Klar for å modernisere treningsadministrasjonen?
            </h2>
            <p className="text-xl text-gray-900/80 mb-12">
              Bli med tusenvis av fornøyde brukere som har gjort treningsregistrering enkelt og effektivt
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="mailto:yngve@promonorge.no?subject=Ønsker å komme i gang med AKTIVITETSLOGG" 
                 className="bg-gray-900 text-yellow-500 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all transform hover:-translate-y-1">
                🚀 Kom i gang i dag
              </a>
              <a href="mailto:yngve@promonorge.no?subject=Spørsmål om AKTIVITETSLOGG" 
                 className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-900 hover:text-yellow-500 transition-all">
                💬 Still spørsmål
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 border-t border-yellow-500/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Company Info */}
              <div>
                <div className="text-yellow-500 font-bold text-xl mb-6">AKTIVITETSLOGG.no</div>
                <p className="text-gray-400 mb-4">
                  Digital treningsregistrering for moderne skytterlag og idrettslag.
                </p>
                <p className="text-sm text-gray-500">
                  Utviklet av <a href="https://promonorge.no" className="text-yellow-500 hover:text-yellow-400">promonorge.no</a>
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-500">Hurtiglenker</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-yellow-500 transition-colors">Funksjoner</a></li>
                  <li><a href="#benefits" className="text-gray-400 hover:text-yellow-500 transition-colors">Fordeler</a></li>
                  <li><a href="#pricing" className="text-gray-400 hover:text-yellow-500 transition-colors">Priser</a></li>
                  <li><a href="mailto:yngve@promonorge.no" className="text-gray-400 hover:text-yellow-500 transition-colors">Support</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-500">Kontakt oss</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-500">📧</div>
                    <a href="mailto:yngve@promonorge.no" className="text-gray-400 hover:text-yellow-500 transition-colors">
                      yngve@promonorge.no
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-500">🌐</div>
                    <a href="https://promonorge.no" className="text-gray-400 hover:text-yellow-500 transition-colors">
                      promonorge.no
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-500">🇳🇴</div>
                    <span className="text-gray-400">Utviklet i Norge</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-12 pt-8 text-center">
              <p className="text-gray-500 text-sm">
                © 2025 AKTIVITETSLOGG.no - Utviklet av promonorge.no. Alle rettigheter reservert.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { FontMetadata, FontPairing } from "./types";

export const ENGLISH_FONTS: FontMetadata[] = [
  {
    id: "inter",
    name: "Inter",
    apiName: "Inter",
    category: "sans-serif",
    developer: "Rasmus Andersson",
    description: "전 세계 디지털 인터페이스의 사실상 표준이며, 극도로 높은 무결성과 가독성을 지닌 중립적 샌드서리프입니다.",
    languages: ["EN"],
    vibeTags: ["Modern", "Neutral", "Clean", "UI/UX"]
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    apiName: "Space+Grotesk",
    category: "sans-serif",
    developer: "Florian Karsten",
    description: "미래지향적인 기하학 구조를 기본으로 하면서도 기발한 디테일을 숨겨둔 개성 넘치는 테크 서체입니다.",
    languages: ["EN"],
    vibeTags: ["Tech", "Futuristic", "Geek", "Trendy"]
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    apiName: "Playfair+Display",
    category: "serif",
    developer: "Claus Eggers Sørensen",
    description: "18세기 후반 계몽시대의 고풍스러운 명조체 비율에서 영감을 받은, 하이 콘트라스트의 고급스러운 헤드라인 세리프입니다.",
    languages: ["EN"],
    vibeTags: ["Elegant", "Luxury", "Classic", "Editorial"]
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    apiName: "JetBrains+Mono",
    category: "monospace",
    developer: "JetBrains",
    description: "모든 코드가 아름답게 읽히도록 세밀하게 조정된 개발자 최적성 폰트로, 특유의 수직적 곧음이 탁월합니다.",
    languages: ["EN"],
    vibeTags: ["Coding", "System", "Industrial", "Minimalist"]
  },
  {
    id: "syne",
    name: "Syne",
    apiName: "Syne",
    category: "display",
    developer: "Bonjour Monde",
    description: "패션과 아트 디렉션에 걸맞은 좌우로 극단적으로 확장 가능한 기발한 자형을 가진 컨템포러리 디스플레이 디자인입니다.",
    languages: ["EN"],
    vibeTags: ["Artistic", "Bold", "Avant-garde", "Hip"]
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    apiName: "Cormorant+Garamond",
    category: "serif",
    developer: "Christian Thalmann",
    description: "수려하고 정교한 가라몬드 유산의 기품을 완벽하게 재구성한, 섬세하고 우아한 노블 세리프입니다.",
    languages: ["EN"],
    vibeTags: ["Luxury", "Traditional", "Pure", "Romantic"]
  },
  {
    id: "outfit",
    name: "Outfit",
    apiName: "Outfit",
    category: "sans-serif",
    developer: "Outfit.io",
    description: "매끄러운 동그라미 형태 기반의 정밀하고 따뜻함이 가미된 모던 미니멀 기하학 서체입니다.",
    languages: ["EN"],
    vibeTags: ["Friendly", "Circular", "Trendy", "Brand"]
  },
  {
    id: "montserrat",
    name: "Montserrat",
    apiName: "Montserrat",
    category: "sans-serif",
    developer: "Julieta Ulanovsky",
    description: "부에노스아이레스 몬세라트 지역의 역사적인 도심 표지판 타이포그래피에서 영감을 얻은 도회적이고 볼드한 샌드서리프입니다.",
    languages: ["EN"],
    vibeTags: ["Urban", "Dynamic", "Geometric", "Heavy"]
  },
  {
    id: "fraunces",
    name: "Fraunces",
    apiName: "Fraunces",
    category: "serif",
    developer: "Undercase Type",
    description: "올드스타일 세리프의 풍부한 잉크 트랩과 청키한 두께 대비를 가진 아날로그 감성의 캐주얼 럭셔리 세리프입니다.",
    languages: ["EN"],
    vibeTags: ["Warm", "Vintage", "Chunky", "Comfortable"]
  },
  {
    id: "plus-jakarta-sans",
    name: "Plus Jakarta Sans",
    apiName: "Plus+Jakarta+Sans",
    category: "sans-serif",
    developer: "Tokotype",
    description: "혁신 기술 스타트업들이 애용하는, 미세한 위트와 단단한 곡선미를 품은 세련된 커머셜 샌드서리프입니다.",
    languages: ["EN"],
    vibeTags: ["Premium", "Startup", "Tech", "Professional"]
  },
  {
    id: "cinzel",
    name: "Cinzel",
    apiName: "Cinzel",
    category: "serif",
    developer: "Natanael Gama",
    description: "고대 로마 비석 조각에 사용되었던 자형 비율을 계승하여 클래식 역사성과 압도적인 정체성을 풍깁니다.",
    languages: ["EN"],
    vibeTags: ["Classic", "Imperial", "Display", "Title"]
  },
  {
    id: "bricolage-grotesque",
    name: "Bricolage Grotesque",
    apiName: "Bricolage+Grotesque",
    category: "sans-serif",
    developer: "Mathieu Triay",
    description: "전통 프랑스 타이포그래피 콜라주 기법과 잉크 스프레드 디테일을 살린 위트 있고 유쾌한 분위기의 모던 서체입니다.",
    languages: ["EN"],
    vibeTags: ["Quirky", "Creative", "Playful", "Expressive"]
  }
];

export const KOREAN_FONTS: FontMetadata[] = [
  {
    id: "noto-sans-kr",
    name: "Noto Sans KR",
    apiName: "Noto+Sans+KR",
    category: "sans-serif",
    developer: "Google & Adobe",
    description: "구글과 어도비의 합작품으로 한글 본문 가독성의 절대 가이드가 되는 최고 완성도의 고딕 서체입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Standard", "Clean", "Highly Readible", "Neutral"]
  },
  {
    id: "nanum-gothic",
    name: "Nanum Gothic",
    apiName: "Nanum+Gothic",
    category: "sans-serif",
    developer: "Naver",
    description: "끝부분이 살짝 둥글게 다듬어져 다정하면서도 맑고 선명한 인상을 심어주는 한국의 대표 고딕입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Friendly", "Warm", "Soft", "Familiar"]
  },
  {
    id: "nanum-myeongjo",
    name: "Nanum Myeongjo",
    apiName: "Nanum+Myeongjo",
    category: "serif",
    developer: "Naver",
    description: "섬세한 붓끝의 결을 현대적인 판독 기준에 어우러지도록 정리한, 유려하고 차분한 한국의 기본 명조입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Literary", "Traditional", "Calm", "Poetic"]
  },
  {
    id: "gowun-batang",
    name: "Gowun Batang",
    apiName: "Gowun+Batang",
    category: "serif",
    developer: "Sungeun Lee",
    description: "소설책의 한 페이지처럼 평화롭고 고즈넉한 온기를 닮은 기품 있고 단정하게 가꾼 명조입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Warm", "Cozy", "Pure", "Handcrafted"]
  },
  {
    id: "gowun-dodum",
    name: "Gowun Dodum",
    apiName: "Gowun+Dodum",
    category: "sans-serif",
    developer: "Sungeun Lee",
    description: "반듯한 뼈대 안에 연필 손글씨 같은 사랑스러운 미감을 정갈하게 녹여낸 현대적인 돋움 서체입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Friendly", "Cute", "Clean", "Comfortable"]
  },
  {
    id: "do-hyeon",
    name: "Do Hyeon",
    apiName: "Do+Hyeon",
    category: "display",
    developer: "Woowa Brothers",
    description: "배달의민족 특유의 위트 넘치는 기하학 비율과 큼직하고 시원시원한 아크릴판 컷팅 형상을 담은 한글 타이틀 서체입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Bold", "Geometrical", "Pop", "Headline"]
  },
  {
    id: "black-han-sans",
    name: "Black Han Sans",
    apiName: "Black+Han+Sans",
    category: "display",
    developer: "Zess Type",
    description: "한글 글씨 공간의 네모난 압축 한계를 아방가르드한 미적으로 끌어올린, 거대하고 묵직한 힘을 내뿜는 포스터 서체입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Ultra-Heavy", "Impactful", "Brutalist", "Visual"]
  },
  {
    id: "ibm-plex-sans-kr",
    name: "IBM Plex Sans KR",
    apiName: "IBM+Plex+Sans+KR",
    category: "sans-serif",
    developer: "IBM & Sandoll",
    description: "기계적인 정밀함과 인간적인 부드러움의 충돌을 멋지게 소화해 내어 차갑고 고급스러운 엔지니어 성향을 보여줍니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Tech", "Industrial", "Professional", "Sharp"]
  },
  {
    id: "song-myung",
    name: "Song Myung",
    apiName: "Song+Myung",
    category: "serif",
    developer: "Song-Myung Design",
    description: "목판 활자의 단단한 세로획 대비와 부드러운 가로 방향 붓놀림이 완벽히 대조를 이루며 격조 높은 예스러움을 드높입니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Traditional", "Bold Serif", "Artistic", "Historical"]
  },
  {
    id: "nanum-brush-script",
    name: "Nanum Brush Script",
    apiName: "Nanum+Brush+Script",
    category: "handwriting",
    developer: "Naver",
    description: "생동감 넘치고 시원시원하게 획을 그어내려 붓글씨 특유의 감정적 여백과 호소력을 그대로 극대화합니다.",
    languages: ["KO", "EN"],
    vibeTags: ["Personal", "Handwrite", "Expressive", "Emotional"]
  }
];

export const PRESET_PAIRINGS: FontPairing[] = [
  {
    id: "cyber-industrial",
    name: "사이버 펑크 & 테크 비즈니스",
    englishFont: ENGLISH_FONTS.find(f => f.id === "space-grotesk")!,
    koreanFont: KOREAN_FONTS.find(f => f.id === "ibm-plex-sans-kr")!,
    description: "미래지향적인 기하학 자형과 기계적 정 정밀함이 결합된, 최신 개발사 및 IT 스타트업 브랜딩에 최적인 하이브리드 조합입니다.",
    englishScale: 1.02,
    englishWeightOffset: 0,
    koreanWeightOffset: 0,
    letterSpacing: "-0.02em",
    descriptionEx: "Space Grotesk가 품은 특유의 위트 있는 심볼 자형이 IBM Plex Sans KR의 단단하고 빈틈없는 한글 구조를 만나면서 극도로 세련된 '테크 블로그'나 'SaaS 제안서'의 세련됨을 구현합니다."
  },
  {
    id: "modern-editorial",
    name: "타임리스 프렌치 가든",
    englishFont: ENGLISH_FONTS.find(f => f.id === "playfair-display")!,
    koreanFont: KOREAN_FONTS.find(f => f.id === "nanum-myeongjo")!,
    description: "럭셔리하고 고풍스러운 우아함이 어우러져 매거진, 에세이, 라이프스타일 브랜드 로고 및 본문에 고급스러운 리듬감을 심어줍니다.",
    englishScale: 0.95,
    englishWeightOffset: 0,
    koreanWeightOffset: 0,
    letterSpacing: "-0.01em",
    descriptionEx: "Playfair Display의 강한 세로 가로 두께 대비가 한글 명조 중에서 가장 클래식한 Nanum Myeongjo와 만납니다. 영문이 시각적으로 다소 과감하게 느껴질 수 있으므로 영문 크기를 95% 수준으로 살짝 가라앉히면 완벽한 자간 조화가 생깁니다."
  },
  {
    id: "warm-bento",
    name: "따뜻한 손글씨 소설책",
    englishFont: ENGLISH_FONTS.find(f => f.id === "fraunces")!,
    koreanFont: KOREAN_FONTS.find(f => f.id === "gowun-batang")!,
    description: "한 장씩 소중하게 읽어내려가는 다정한 분위기를 자아내며, 독립 서점, 차분한 오프라인 카페, 힐링 블로그에 이상적인 조합입니다.",
    englishScale: 1.04,
    englishWeightOffset: 0,
    koreanWeightOffset: 0,
    letterSpacing: "0.01em",
    descriptionEx: "Fraunces의 동글동글하면서도 잉크 방울이 맺힌 듯한 빈티지 자형이, 가로쓰기와 세로짜기 모두에 최적화된 고즈넉한 온도의 Gowun Batang에 스며듭니다. 영문 크기를 104% 정도로 키워 한국어 서체의 넉넉한 정방형 크기에 알맞게 맞추었습니다."
  },
  {
    id: "ultra-bold-punk",
    name: "포스터 아방가르드",
    englishFont: ENGLISH_FONTS.find(f => f.id === "syne")!,
    koreanFont: KOREAN_FONTS.find(f => f.id === "black-han-sans")!,
    description: "스트릿 패션, 아트비주얼 포스터, 힙한 브랜드 대문을 뒤흔드는 파격적인 비주얼 임팩트로 가득 찬 디자이너 프리셋입니다.",
    englishScale: 1.03,
    englishWeightOffset: 100,
    koreanWeightOffset: 0,
    letterSpacing: "-0.04em",
    descriptionEx: "자간이 조밀하고 굵기가 육중한 Black Han Sans는 자칫 너무 기계적으로 보일 수 있습니다. 여기에 아주 예술적이고 실험적인 Syne 서체를 더하면, 단조로운 한글 디스플레이 영역에 시각적 긴장감을 주어 환상적인 볼거리를 완성합니다."
  },
  {
    id: "neutral-standard",
    name: "글로벌 테크 스타트업 실리콘밸리",
    englishFont: ENGLISH_FONTS.find(f => f.id === "inter")!,
    koreanFont: KOREAN_FONTS.find(f => f.id === "noto-sans-kr")!,
    description: "가장 기본적이면서 절대 실패하지 않는 정통파 유행 서체입니다. 모바일 앱 인터페이스, 뉴스피드, 테크닉 문서 등에 아주 적격입니다.",
    englishScale: 1.01,
    englishWeightOffset: 0,
    koreanWeightOffset: 0,
    letterSpacing: "-0.02em",
    descriptionEx: "전 세계 모바일 디자인의 표준인 Inter 폰트와 뛰어난 본문 가독성을 인증받은 Noto Sans KR의 가장 자연스러운 매칭입니다. 자간을 평소보다 -2% 좁게 조정하면 눈의 굴절 피로도를 격감시켜 매끄러운 다국어 장문 독서를 지원합니다."
  }
];

export const PREVIEW_TEMPLATES = [
  {
    id: "editorial",
    name: "Editorial Poster (매거진 포스터)",
    description: "고해상도 에세이나 대리석 같은 질감의 시각 잡지 레이아웃"
  },
  {
    id: "tech-dashboard",
    name: "Tech Dashboard & Metrics (테크 계기판)",
    description: "정밀 수치와 기하학 수치, 코드 믹스 스타일"
  },
  {
    id: "e-commerce",
    name: "E-Commerce Card (쇼핑몰 상세)",
    description: "세련된 제품 이름, 가격, 태그 및 세부 스펙 안내 피드"
  },
  {
    id: "sandbox",
    name: "Universal Typewriter (자유 샌드박스)",
    description: "원하는 문장을 편하게 타이핑하며 확인하는 메모장"
  }
];

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AthletesList } from "@/components/athletes/athletes-list";

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  country: string;
  province: string;
  club?: string;
  note?: string;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_ATHLETES: Athlete[] = [
  // Thailand - Bangkok
  {
    id: "ath-001",
    first_name: "Somchai",
    last_name: "Rakdee",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    club: "ชมรมเดินทนกรุงเทพฯ",
    note: "นักกีฬาทีมชาติ",
  },
  {
    id: "ath-002",
    first_name: "Sumalee",
    last_name: "Pongsakul",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    club: "ชมรมเดินทนกรุงเทพฯ",
    note: "แชมป์ประเทศไทย 2023",
  },
  {
    id: "ath-003",
    first_name: "Anon",
    last_name: "Wattana",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    club: "Bangkok Race Walk Club",
    note: "",
  },
  {
    id: "ath-004",
    first_name: "Pranee",
    last_name: "Srisawat",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    club: "Bangkok Race Walk Club",
    note: "นักกีฬารุ่นเยาว์",
  },
  {
    id: "ath-005",
    first_name: "Thiraphon",
    last_name: "Chaiyasit",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    club: "ชมรมเดินทนกรุงเทพฯ",
    note: "",
  },
  // Thailand - Chiang Mai
  {
    id: "ath-006",
    first_name: "Nattapong",
    last_name: "Suwannarat",
    affiliation: "สมาคมกรีฑาภาคเหนือ",
    country: "Thailand",
    province: "เชียงใหม่",
    club: "Chiang Mai Athletics",
    note: "สถิติจังหวัดเชียงใหม่",
  },
  {
    id: "ath-007",
    first_name: "Waraporn",
    last_name: "Kaewmool",
    affiliation: "สมาคมกรีฑาภาคเหนือ",
    country: "Thailand",
    province: "เชียงใหม่",
    club: "Chiang Mai Athletics",
    note: "",
  },
  {
    id: "ath-008",
    first_name: "Kittipong",
    last_name: "Namsing",
    affiliation: "สมาคมกรีฑาภาคเหนือ",
    country: "Thailand",
    province: "เชียงใหม่",
    club: "Northern Walk Club",
    note: "นักกีฬาดาวรุ่ง",
  },
  // Thailand - Phuket
  {
    id: "ath-009",
    first_name: "Somsak",
    last_name: "Thongdee",
    affiliation: "สมาคมกรีฑาภาคใต้",
    country: "Thailand",
    province: "ภูเก็ต",
    club: "Phuket Race Walk",
    note: "",
  },
  {
    id: "ath-010",
    first_name: "Wannee",
    last_name: "Siriporn",
    affiliation: "สมาคมกรีฑาภาคใต้",
    country: "Thailand",
    province: "ภูเก็ต",
    club: "Phuket Race Walk",
    note: "ผู้เข้าแข่งขันระดับอาเซียน",
  },
  // Thailand - Khon Kaen
  {
    id: "ath-011",
    first_name: "Preecha",
    last_name: "Saengsuk",
    affiliation: "สมาคมกรีฑาภาคอีสาน",
    country: "Thailand",
    province: "ขอนแก่น",
    club: "Khon Kaen Athletics",
    note: "",
  },
  {
    id: "ath-012",
    first_name: "Siriporn",
    last_name: "Boonsri",
    affiliation: "สมาคมกรีฑาภาคอีสาน",
    country: "Thailand",
    province: "ขอนแก่น",
    club: "Khon Kaen Athletics",
    note: "นักกีฬาเยาวชน",
  },
  // USA - California
  {
    id: "ath-013",
    first_name: "Jane",
    last_name: "Doe",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "California",
    club: "Los Angeles Race Walkers",
    note: "Olympic Trials participant",
  },
  {
    id: "ath-014",
    first_name: "Michael",
    last_name: "Johnson",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "California",
    club: "San Francisco Athletics",
    note: "",
  },
  {
    id: "ath-015",
    first_name: "Sarah",
    last_name: "Williams",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "California",
    club: "Los Angeles Race Walkers",
    note: "National Champion 2023",
  },
  {
    id: "ath-016",
    first_name: "David",
    last_name: "Brown",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "California",
    club: "San Diego Walk Club",
    note: "",
  },
  // USA - New York
  {
    id: "ath-017",
    first_name: "Emily",
    last_name: "Davis",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "New York",
    club: "New York Race Walk",
    note: "Former national record holder",
  },
  {
    id: "ath-018",
    first_name: "Robert",
    last_name: "Martinez",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "New York",
    club: "Brooklyn Athletics",
    note: "",
  },
  {
    id: "ath-019",
    first_name: "Jennifer",
    last_name: "Garcia",
    affiliation: "USA Track & Field",
    country: "USA",
    province: "New York",
    club: "New York Race Walk",
    note: "Junior champion",
  },
  // Japan - Tokyo
  {
    id: "ath-020",
    first_name: "Takeshi",
    last_name: "Yamamoto",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Tokyo",
    club: "Tokyo Race Walk Club",
    note: "Olympic representative",
  },
  {
    id: "ath-021",
    first_name: "Yuki",
    last_name: "Tanaka",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Tokyo",
    club: "Tokyo Race Walk Club",
    note: "",
  },
  {
    id: "ath-022",
    first_name: "Sakura",
    last_name: "Nakamura",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Tokyo",
    club: "Shibuya Athletics",
    note: "National record holder",
  },
  {
    id: "ath-023",
    first_name: "Hiroshi",
    last_name: "Suzuki",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Tokyo",
    club: "Tokyo Race Walk Club",
    note: "",
  },
  // Japan - Osaka
  {
    id: "ath-024",
    first_name: "Kenji",
    last_name: "Watanabe",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Osaka",
    club: "Osaka Walk Club",
    note: "Regional champion",
  },
  {
    id: "ath-025",
    first_name: "Ayumi",
    last_name: "Kobayashi",
    affiliation: "Japan Association of Athletics Federations",
    country: "Japan",
    province: "Osaka",
    club: "Osaka Walk Club",
    note: "",
  },
  // China - Beijing
  {
    id: "ath-026",
    first_name: "Wei",
    last_name: "Zhang",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Beijing",
    club: "Beijing Race Walk Team",
    note: "Olympic gold medalist",
  },
  {
    id: "ath-027",
    first_name: "Li",
    last_name: "Wang",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Beijing",
    club: "Beijing Race Walk Team",
    note: "World Championship participant",
  },
  {
    id: "ath-028",
    first_name: "Jing",
    last_name: "Liu",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Beijing",
    club: "Beijing Race Walk Team",
    note: "",
  },
  {
    id: "ath-029",
    first_name: "Feng",
    last_name: "Chen",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Beijing",
    club: "Capital Athletics",
    note: "National champion",
  },
  // China - Shanghai
  {
    id: "ath-030",
    first_name: "Ming",
    last_name: "Yang",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Shanghai",
    club: "Shanghai Walk Club",
    note: "",
  },
  {
    id: "ath-031",
    first_name: "Xiao",
    last_name: "Zhou",
    affiliation: "Chinese Athletic Association",
    country: "China",
    province: "Shanghai",
    club: "Shanghai Walk Club",
    note: "Rising star",
  },
  // South Korea - Seoul
  {
    id: "ath-032",
    first_name: "Min-ji",
    last_name: "Kim",
    affiliation: "Korea Association of Athletics Federations",
    country: "South Korea",
    province: "Seoul",
    club: "Seoul Race Walk",
    note: "",
  },
  {
    id: "ath-033",
    first_name: "Sung-ho",
    last_name: "Park",
    affiliation: "Korea Association of Athletics Federations",
    country: "South Korea",
    province: "Seoul",
    club: "Seoul Race Walk",
    note: "National record holder",
  },
  {
    id: "ath-034",
    first_name: "Ji-woo",
    last_name: "Lee",
    affiliation: "Korea Association of Athletics Federations",
    country: "South Korea",
    province: "Seoul",
    club: "Gangnam Athletics",
    note: "",
  },
  // Singapore
  {
    id: "ath-035",
    first_name: "Wei Ling",
    last_name: "Tan",
    affiliation: "Singapore Athletic Association",
    country: "Singapore",
    province: "Singapore",
    club: "Singapore Race Walk",
    note: "SEA Games medalist",
  },
  {
    id: "ath-036",
    first_name: "Ahmad",
    last_name: "Hassan",
    affiliation: "Singapore Athletic Association",
    country: "Singapore",
    province: "Singapore",
    club: "Singapore Race Walk",
    note: "",
  },
  // Malaysia - Kuala Lumpur
  {
    id: "ath-037",
    first_name: "Aziz",
    last_name: "Rahman",
    affiliation: "Malaysian Athletics Federation",
    country: "Malaysia",
    province: "Kuala Lumpur",
    club: "KL Athletics Club",
    note: "",
  },
  {
    id: "ath-038",
    first_name: "Siti",
    last_name: "Abdullah",
    affiliation: "Malaysian Athletics Federation",
    country: "Malaysia",
    province: "Kuala Lumpur",
    club: "KL Athletics Club",
    note: "National champion",
  },
  // Vietnam - Hanoi
  {
    id: "ath-039",
    first_name: "Nguyen",
    last_name: "Van An",
    affiliation: "Vietnam Athletics Federation",
    country: "Vietnam",
    province: "Hanoi",
    club: "Hanoi Walk Club",
    note: "",
  },
  {
    id: "ath-040",
    first_name: "Tran",
    last_name: "Thi Mai",
    affiliation: "Vietnam Athletics Federation",
    country: "Vietnam",
    province: "Hanoi",
    club: "Hanoi Walk Club",
    note: "SEA Games participant",
  },
  // Philippines - Manila
  {
    id: "ath-041",
    first_name: "Jose",
    last_name: "Santos",
    affiliation: "Philippine Athletics Track and Field Association",
    country: "Philippines",
    province: "Manila",
    club: "Manila Race Walk",
    note: "",
  },
  {
    id: "ath-042",
    first_name: "Maria",
    last_name: "Reyes",
    affiliation: "Philippine Athletics Track and Field Association",
    country: "Philippines",
    province: "Manila",
    club: "Manila Race Walk",
    note: "National record holder",
  },
  // Indonesia - Jakarta
  {
    id: "ath-043",
    first_name: "Budi",
    last_name: "Santoso",
    affiliation: "Indonesian Athletics Federation",
    country: "Indonesia",
    province: "Jakarta",
    club: "Jakarta Athletics",
    note: "",
  },
  {
    id: "ath-044",
    first_name: "Dewi",
    last_name: "Putri",
    affiliation: "Indonesian Athletics Federation",
    country: "Indonesia",
    province: "Jakarta",
    club: "Jakarta Athletics",
    note: "",
  },
  // Australia - Sydney
  {
    id: "ath-045",
    first_name: "James",
    last_name: "Smith",
    affiliation: "Athletics Australia",
    country: "Australia",
    province: "New South Wales",
    club: "Sydney Striders",
    note: "Commonwealth Games bronze",
  },
  {
    id: "ath-046",
    first_name: "Emma",
    last_name: "Wilson",
    affiliation: "Athletics Australia",
    country: "Australia",
    province: "New South Wales",
    club: "Sydney Striders",
    note: "",
  },
  // Australia - Melbourne
  {
    id: "ath-047",
    first_name: "Oliver",
    last_name: "Taylor",
    affiliation: "Athletics Australia",
    country: "Australia",
    province: "Victoria",
    club: "Melbourne Walk Club",
    note: "National champion",
  },
  {
    id: "ath-048",
    first_name: "Sophie",
    last_name: "Anderson",
    affiliation: "Athletics Australia",
    country: "Australia",
    province: "Victoria",
    club: "Melbourne Walk Club",
    note: "",
  },
  // UK - London
  {
    id: "ath-049",
    first_name: "Tom",
    last_name: "Walker",
    affiliation: "UK Athletics",
    country: "United Kingdom",
    province: "London",
    club: "London Race Walk Club",
    note: "Olympic qualifier",
  },
  {
    id: "ath-050",
    first_name: "Charlotte",
    last_name: "Evans",
    affiliation: "UK Athletics",
    country: "United Kingdom",
    province: "London",
    club: "London Race Walk Club",
    note: "",
  },
  // Germany - Berlin
  {
    id: "ath-051",
    first_name: "Hans",
    last_name: "Mueller",
    affiliation: "German Athletics Association",
    country: "Germany",
    province: "Berlin",
    club: "Berlin Walk Team",
    note: "European Championship participant",
  },
  {
    id: "ath-052",
    first_name: "Anna",
    last_name: "Schmidt",
    affiliation: "German Athletics Association",
    country: "Germany",
    province: "Berlin",
    club: "Berlin Walk Team",
    note: "",
  },
  // France - Paris
  {
    id: "ath-053",
    first_name: "Pierre",
    last_name: "Dubois",
    affiliation: "French Athletics Federation",
    country: "France",
    province: "Île-de-France",
    club: "Paris Race Walk",
    note: "National champion",
  },
  {
    id: "ath-054",
    first_name: "Marie",
    last_name: "Martin",
    affiliation: "French Athletics Federation",
    country: "France",
    province: "Île-de-France",
    club: "Paris Race Walk",
    note: "",
  },
  // Italy - Rome
  {
    id: "ath-055",
    first_name: "Marco",
    last_name: "Rossi",
    affiliation: "Italian Athletics Federation",
    country: "Italy",
    province: "Lazio",
    club: "Roma Athletics",
    note: "World Championship medalist",
  },
  {
    id: "ath-056",
    first_name: "Giulia",
    last_name: "Ferrari",
    affiliation: "Italian Athletics Federation",
    country: "Italy",
    province: "Lazio",
    club: "Roma Athletics",
    note: "",
  },
  // Spain - Madrid
  {
    id: "ath-057",
    first_name: "Carlos",
    last_name: "Garcia",
    affiliation: "Royal Spanish Athletics Federation",
    country: "Spain",
    province: "Madrid",
    club: "Madrid Walk Club",
    note: "",
  },
  {
    id: "ath-058",
    first_name: "Isabel",
    last_name: "Lopez",
    affiliation: "Royal Spanish Athletics Federation",
    country: "Spain",
    province: "Madrid",
    club: "Madrid Walk Club",
    note: "Olympic representative",
  },
  // Canada - Toronto
  {
    id: "ath-059",
    first_name: "Alex",
    last_name: "Thompson",
    affiliation: "Athletics Canada",
    country: "Canada",
    province: "Ontario",
    club: "Toronto Race Walk",
    note: "",
  },
  {
    id: "ath-060",
    first_name: "Rachel",
    last_name: "Moore",
    affiliation: "Athletics Canada",
    country: "Canada",
    province: "Ontario",
    club: "Toronto Race Walk",
    note: "Pan Am Games participant",
  },
  // Additional Thai athletes
  {
    id: "ath-061",
    first_name: "Chalerm",
    last_name: "Phongsri",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "นนทบุรี",
    club: "Nonthaburi Athletics",
    note: "",
  },
  {
    id: "ath-062",
    first_name: "Narong",
    last_name: "Jaidee",
    affiliation: "สมาคมกรีฑาแห่งประเทศไทย",
    country: "Thailand",
    province: "ปทุมธานี",
    club: "Pathum Thani Walk",
    note: "มือใหม่",
  },
];

export const metadata: Metadata = {
  title: "จัดการนักกีฬา – การแข่งขันเดินทน",
  description:
    "หน้ารายชื่อนักกีฬาทั้งหมดที่ลงทะเบียนในระบบการแข่งขันเดินทน",
};

export default function AthletesPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการนักกีฬา
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายชื่อนักกีฬาทั้งหมดที่ถูกลงทะเบียนในระบบการแข่งขันเดินทน
            </p>
          </div>

          <Link href="/admin/athletes/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่มนักกีฬาใหม่
            </Button>
          </Link>
        </div>

        <AthletesList athletes={MOCK_ATHLETES} />
      </div>
    </main>
  );
}



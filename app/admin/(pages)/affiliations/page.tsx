import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AffiliationsList } from "@/components/affiliations/affiliations-list";

type Affiliation = {
  id: string;
  name: string;
  head_of_affiliation: string;
  join_at: string;
  country?: string;
  province?: string;
  note?: string;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_AFFILIATIONS: Affiliation[] = [
  // Thailand - Bangkok
  {
    id: "aff-001",
    name: "ชมรมเดินทนกรุงเทพฯ",
    head_of_affiliation: "นายสมชาย รักดี",
    join_at: "2024-01-15",
    country: "ประเทศไทย",
    province: "กรุงเทพมหานคร",
    note: "กลุ่มตัวอย่างสำหรับทดสอบระบบ",
  },
  {
    id: "aff-002",
    name: "สมาคมกรีฑาแห่งประเทศไทย",
    head_of_affiliation: "นายประสิทธิ์ วิริยะกุล",
    join_at: "2023-05-10",
    country: "ประเทศไทย",
    province: "กรุงเทพมหานคร",
    note: "สมาคมหลัก",
  },
  {
    id: "aff-003",
    name: "Bangkok Race Walk Club",
    head_of_affiliation: "นายอนนท์ วัฒนา",
    join_at: "2024-02-20",
    country: "ประเทศไทย",
    province: "กรุงเทพมหานคร",
    note: "",
  },
  // Thailand - Other Provinces
  {
    id: "aff-004",
    name: "สมาคมกรีฑาภาคเหนือ",
    head_of_affiliation: "นายนัทพงษ์ สุวรรณรัตน์",
    join_at: "2023-08-15",
    country: "ประเทศไทย",
    province: "เชียงใหม่",
    note: "",
  },
  {
    id: "aff-005",
    name: "Chiang Mai Athletics",
    head_of_affiliation: "นางวราพร แก้วมูล",
    join_at: "2024-03-05",
    country: "ประเทศไทย",
    province: "เชียงใหม่",
    note: "ชมรมนักกีฬาเชียงใหม่",
  },
  {
    id: "aff-006",
    name: "Northern Walk Club",
    head_of_affiliation: "นายกิตติพงษ์ น้ำสิงห์",
    join_at: "2024-01-10",
    country: "ประเทศไทย",
    province: "เชียงใหม่",
    note: "",
  },
  {
    id: "aff-007",
    name: "สมาคมกรีฑาภาคใต้",
    head_of_affiliation: "นายสมศักดิ์ ทองดี",
    join_at: "2023-11-20",
    country: "ประเทศไทย",
    province: "ภูเก็ต",
    note: "",
  },
  {
    id: "aff-008",
    name: "Phuket Race Walk",
    head_of_affiliation: "นางวรรณี ศิริพร",
    join_at: "2024-04-12",
    country: "ประเทศไทย",
    province: "ภูเก็ต",
    note: "",
  },
  {
    id: "aff-009",
    name: "สมาคมกรีฑาภาคอีสาน",
    head_of_affiliation: "นายปรีชา แสงสุข",
    join_at: "2023-09-08",
    country: "ประเทศไทย",
    province: "ขอนแก่น",
    note: "สมาคมภาคอีสาน",
  },
  {
    id: "aff-010",
    name: "Khon Kaen Athletics",
    head_of_affiliation: "นางศิริพร บุญศรี",
    join_at: "2024-02-15",
    country: "ประเทศไทย",
    province: "ขอนแก่น",
    note: "",
  },
  // USA
  {
    id: "aff-011",
    name: "USA Track & Field",
    head_of_affiliation: "Michael Anderson",
    join_at: "2023-01-05",
    country: "USA",
    province: "California",
    note: "National governing body",
  },
  {
    id: "aff-012",
    name: "Los Angeles Race Walkers",
    head_of_affiliation: "Jane Doe",
    join_at: "2023-06-15",
    country: "USA",
    province: "California",
    note: "",
  },
  {
    id: "aff-013",
    name: "San Francisco Athletics",
    head_of_affiliation: "Robert Martinez",
    join_at: "2023-09-22",
    country: "USA",
    province: "California",
    note: "",
  },
  {
    id: "aff-014",
    name: "New York Race Walk",
    head_of_affiliation: "Emily Davis",
    join_at: "2023-07-10",
    country: "USA",
    province: "New York",
    note: "Established 1985",
  },
  {
    id: "aff-015",
    name: "Brooklyn Athletics",
    head_of_affiliation: "Sarah Williams",
    join_at: "2024-01-20",
    country: "USA",
    province: "New York",
    note: "",
  },
  // Japan
  {
    id: "aff-016",
    name: "Japan Association of Athletics Federations",
    head_of_affiliation: "Takeshi Yamamoto",
    join_at: "2023-02-14",
    country: "Japan",
    province: "Tokyo",
    note: "日本陸上競技連盟",
  },
  {
    id: "aff-017",
    name: "Tokyo Race Walk Club",
    head_of_affiliation: "Yuki Tanaka",
    join_at: "2023-10-05",
    country: "Japan",
    province: "Tokyo",
    note: "",
  },
  {
    id: "aff-018",
    name: "Shibuya Athletics",
    head_of_affiliation: "Sakura Nakamura",
    join_at: "2024-03-18",
    country: "Japan",
    province: "Tokyo",
    note: "",
  },
  {
    id: "aff-019",
    name: "Osaka Walk Club",
    head_of_affiliation: "Kenji Watanabe",
    join_at: "2023-12-01",
    country: "Japan",
    province: "Osaka",
    note: "",
  },
  // China
  {
    id: "aff-020",
    name: "Chinese Athletic Association",
    head_of_affiliation: "Wei Zhang",
    join_at: "2023-03-20",
    country: "China",
    province: "Beijing",
    note: "中国田径协会",
  },
  {
    id: "aff-021",
    name: "Beijing Race Walk Team",
    head_of_affiliation: "Li Wang",
    join_at: "2023-08-25",
    country: "China",
    province: "Beijing",
    note: "National training center",
  },
  {
    id: "aff-022",
    name: "Shanghai Walk Club",
    head_of_affiliation: "Ming Yang",
    join_at: "2024-01-08",
    country: "China",
    province: "Shanghai",
    note: "",
  },
  // South Korea
  {
    id: "aff-023",
    name: "Korea Association of Athletics Federations",
    head_of_affiliation: "Sung-ho Park",
    join_at: "2023-04-12",
    country: "South Korea",
    province: "Seoul",
    note: "대한육상연맹",
  },
  {
    id: "aff-024",
    name: "Seoul Race Walk",
    head_of_affiliation: "Min-ji Kim",
    join_at: "2023-11-15",
    country: "South Korea",
    province: "Seoul",
    note: "",
  },
  // Singapore & Malaysia
  {
    id: "aff-025",
    name: "Singapore Athletic Association",
    head_of_affiliation: "Wei Ling Tan",
    join_at: "2023-05-20",
    country: "Singapore",
    province: "Singapore",
    note: "",
  },
  {
    id: "aff-026",
    name: "Malaysian Athletics Federation",
    head_of_affiliation: "Aziz Rahman",
    join_at: "2023-06-30",
    country: "Malaysia",
    province: "Kuala Lumpur",
    note: "",
  },
  // Vietnam & Philippines
  {
    id: "aff-027",
    name: "Vietnam Athletics Federation",
    head_of_affiliation: "Nguyen Van An",
    join_at: "2023-07-18",
    country: "Vietnam",
    province: "Hanoi",
    note: "",
  },
  {
    id: "aff-028",
    name: "Philippine Athletics Track and Field Association",
    head_of_affiliation: "Jose Santos",
    join_at: "2023-09-05",
    country: "Philippines",
    province: "Manila",
    note: "PATAFA",
  },
  // Australia
  {
    id: "aff-029",
    name: "Athletics Australia",
    head_of_affiliation: "James Smith",
    join_at: "2023-02-28",
    country: "Australia",
    province: "New South Wales",
    note: "National body",
  },
  {
    id: "aff-030",
    name: "Sydney Striders",
    head_of_affiliation: "Emma Wilson",
    join_at: "2024-03-10",
    country: "Australia",
    province: "New South Wales",
    note: "",
  },
  {
    id: "aff-031",
    name: "Melbourne Walk Club",
    head_of_affiliation: "Oliver Taylor",
    join_at: "2023-10-22",
    country: "Australia",
    province: "Victoria",
    note: "",
  },
  // Europe
  {
    id: "aff-032",
    name: "UK Athletics",
    head_of_affiliation: "Tom Walker",
    join_at: "2023-01-15",
    country: "United Kingdom",
    province: "London",
    note: "",
  },
  {
    id: "aff-033",
    name: "German Athletics Association",
    head_of_affiliation: "Hans Mueller",
    join_at: "2023-04-20",
    country: "Germany",
    province: "Berlin",
    note: "Deutscher Leichtathletik-Verband",
  },
  {
    id: "aff-034",
    name: "French Athletics Federation",
    head_of_affiliation: "Pierre Dubois",
    join_at: "2023-05-15",
    country: "France",
    province: "Île-de-France",
    note: "Fédération française d'athlétisme",
  },
];

export const metadata = {
  title: "จัดการสังกัด / สโมสร (Affiliations)",
  description: "รายการสังกัด / สโมสรของนักกีฬา เพื่อใช้เชื่อมโยงกับข้อมูล Athlete",
};

export default function AffiliationsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการสังกัด / สโมสร
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการสังกัด / สโมสรของนักกีฬา เพื่อใช้เชื่อมโยงกับข้อมูล Athlete
            </p>
          </div>

          <Link href="/admin/affiliations/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่มสังกัด / สโมสรใหม่
            </Button>
          </Link>
        </div>

        <AffiliationsList affiliations={MOCK_AFFILIATIONS} />
      </div>
    </main>
  );
}



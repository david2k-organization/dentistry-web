import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dental Clinic Manager</h1>
      <p className="text-muted-foreground">Trang chủ phần mềm quản lý nha khoa.</p>
      <Button>Bắt đầu</Button>
    </div>
  );
}

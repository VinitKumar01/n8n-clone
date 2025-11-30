import { Separator } from "@/components/ui/separator";
import { Circle } from "lucide-react";

type Workflows = {
  title: string;
  id: string;
  state: "active" | "not-active";
};

export default function DashboardPage() {
  const workflows: Workflows[] = [
    { title: "Workflow 1", id: "u2iu242ui", state: "active" },
    { title: "Workflow 2", id: "u2iu242ui", state: "not-active" },
    { title: "Workflow 3", id: "u2iu242ui", state: "active" },
    { title: "Workflow 4", id: "u2iu242ui", state: "not-active" },
  ];
  return (
    <div className="w-full h-full bg-black">
      <div className="bg-[#262626] max-w-full h-fit m-8 rounded-md">
        <div className="text-3xl font-bold text-[#E5E5E5] p-4">
          My Workflows
        </div>
        <Separator />

        {workflows.length !== 0 ? (
          <div className="mx-6 grid grid-cols-3">
            {workflows.map((workflow, id) => {
              return (
                <div key={id} className="mx-2 my-4 space-y-2 cursor-pointer">
                  <div className="text-xl font-semibold">{workflow.title}</div>
                  <div className="text-muted-foreground">id: {workflow.id}</div>
                  <div className="flex items-center rounded-md gap-2">
                    {workflow.state === "active" ? (
                      <Circle
                        className="bg-transparent fill-green-500 stroke-green-500"
                        size={10}
                      />
                    ) : (
                      <Circle
                        className="bg-transparent fill-orange-400 stroke-orange-400"
                        size={10}
                      />
                    )}
                    <div>{workflow.state}</div>
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="min-h-72 flex justify-center items-center text-5xl text-[#E5E5E5] font-semibold">
            OOPS!! No workflows found
          </div>
        )}
      </div>
    </div>
  );
}

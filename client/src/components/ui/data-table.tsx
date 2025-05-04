import * as React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: {
    id: string;
    header: React.ReactNode;
    cell: (item: TData) => React.ReactNode;
  }[];
  data: TData[];
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  loadingText = "جاري التحميل...",
  emptyText = "لا توجد بيانات متاحة",
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className="text-right">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {loadingText}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={`${i}-${column.id}`}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

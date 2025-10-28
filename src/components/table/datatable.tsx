"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table"

interface DatatableProps<TData, TValue = unknown>{
    data: TData[];
    columns: ColumnDef<TData, TValue>[];
    caption?: string;
    onRowDoubleClick?: (row: TData) => void;
    meta?: Record<string, any>;
    rowClassName?: (row: TData) => string;
}

export default function Datatable<TData>({
    data,
    columns,
    caption,
    onRowDoubleClick,
    meta,
    rowClassName,
}: DatatableProps<TData, unknown>){
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta,
    });

    return(
        <div>
            <Table className="rounded-md border border-blue-500 overflow-hidden">
                {/* {caption && <TableCaption>{caption}</TableCaption>} */}
                <TableHeader className="rounded-md">
                    {table.getHeaderGroups().map((headerGroup)=>(                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead 
                                    className="font-bold text-center p-0"
                                    key={header.id}
                                    style={{ width: `${header.getSize()}px` }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        :flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row)=>(
                                                        <TableRow 
                                key={row.id}
                                onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row.original)}
                                className={`${onRowDoubleClick ? 'cursor-pointer hover:bg-gray-100' : ''} ${rowClassName ? rowClassName(row.original) : ''}`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-center text-gray-700 px-1 py-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ):(
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-10 text-center text-gray-700">
                                Sin registros
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
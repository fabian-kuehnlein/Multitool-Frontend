import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    computed,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { TableOverview } from '../../../models';
import {
    HotkeyService,
    Hotkeys,
} from '../../../../../core/services/hotkey.service';

@Component({
    selector: 'app-table-sidebar',
    standalone: true,
    imports: [UI_MODULES],
    templateUrl: './table-sidebar.component.html',
    styleUrl: './table-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TableSidebarComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly tables = input<TableOverview[]>([]);
    readonly currentTableId = input<number>(0);

    readonly loadTable = output<number>();

    private readonly hotkeyService = inject(HotkeyService);
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    readonly sidebarList = viewChild<ElementRef<HTMLElement>>('sidebarList');

    protected readonly pageSize = signal<number>(10);
    protected readonly pageIndex = signal<number>(0);

    protected readonly paginatedTableList = computed(() => {
        const list = this.tables();
        const start = this.pageIndex() * this.pageSize();
        return list.slice(start, start + this.pageSize());
    });

    private resizeObserver?: ResizeObserver;

    ngOnInit(): void {
        this.hotkeyUnsubscribers.push(
            this.hotkeyService.register({
                id: 'custom-table.previous',
                combo: Hotkeys.prevPage,
                description: 'Vorherige Seite',
                action: () => this.changeSidebarPage(-1),
            }),
            this.hotkeyService.register({
                id: 'custom-table.next',
                combo: Hotkeys.nextPage,
                description: 'Nächste Seite',
                action: () => this.changeSidebarPage(1),
            }),
        );
    }

    ngAfterViewInit(): void {
        this.setupResizeObserver();
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.hotkeyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
    }

    private changeSidebarPage(direction: 1 | -1): void {
        if (this.tables().length <= this.pageSize()) return;

        const maxPage = Math.max(
            0,
            Math.ceil(this.tables().length / this.pageSize()) - 1,
        );
        this.pageIndex.update((page) => {
            const next = page + direction;
            return Math.min(Math.max(next, 0), maxPage);
        });
    }

    private setupResizeObserver(): void {
        const element = this.sidebarList()?.nativeElement;
        if (!element) return;

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (
                    this.sidebarList() &&
                    entry.target === this.sidebarList()?.nativeElement
                ) {
                    this.calculatePageSize();
                }
            }
        });

        this.resizeObserver.observe(element);
        this.calculatePageSize();
    }

    private calculatePageSize(): void {
        const element = this.sidebarList()?.nativeElement;
        if (!element) return;

        const itemHeight = 56; // 48px standard + 8px gap
        const newPageSize = Math.max(
            1,
            Math.floor(element.clientHeight / itemHeight),
        );
        if (newPageSize !== this.pageSize()) {
            this.pageSize.set(newPageSize);
        }
    }
}

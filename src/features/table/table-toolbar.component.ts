import { BaseComponent } from '../base.component';
import { $, buildAndInterpolate } from '../utils';
import { TableMenuComponent } from './table-menu.component';

export class TableToolbarComponent extends BaseComponent {
    constructor() {
        super();
        this.menu = new TableMenuComponent();
    }

    sync(statusHtml, currentPage, totalPages, selectedRows, columns, visibleColumnIds, pageSize, disabled) {
        this.patchStatus(statusHtml);
        this.updateButtons(disabled);
        this.updatePageInput(currentPage, totalPages);
        this.menu.sync();
    }

    // Other methods to handle button enabling/disabling, updating page input, etc.
}
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('departments')
  listDepartments() {
    return this.catalogsService.list('departments');
  }

  @Roles('admin')
  @Post('departments')
  createDepartment(@Body() body: CreateCatalogItemDto) {
    return this.catalogsService.create('departments', body);
  }

  @Roles('admin')
  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() body: UpdateCatalogItemDto) {
    return this.catalogsService.update('departments', id, body);
  }

  @Get('products')
  listProducts() {
    return this.catalogsService.list('products');
  }

  @Roles('admin')
  @Post('products')
  createProduct(@Body() body: CreateCatalogItemDto) {
    return this.catalogsService.create('products', body);
  }

  @Roles('admin')
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: UpdateCatalogItemDto) {
    return this.catalogsService.update('products', id, body);
  }

  @Get('categories')
  listCategories() {
    return this.catalogsService.list('categories');
  }

  @Roles('admin')
  @Post('categories')
  createCategory(@Body() body: CreateCatalogItemDto) {
    return this.catalogsService.create('categories', body);
  }

  @Roles('admin')
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCatalogItemDto) {
    return this.catalogsService.update('categories', id, body);
  }

  @Get('companies')
  listCompanies() {
    return this.catalogsService.list('companies');
  }

  @Get('company-contacts')
  listContacts() {
    return this.catalogsService.list('company_contacts');
  }
}

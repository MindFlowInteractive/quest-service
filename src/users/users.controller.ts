import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from '../common/validators/file-upload.validator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Example: File upload with validation (avatar upload)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter(['.png', '.jpg', '.jpeg'], ['image/png', 'image/jpeg']),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  }))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    // Only validation logic shown; file storage logic can be added as needed
    return { message: 'Avatar uploaded successfully', filename: file.originalname };
  }
}

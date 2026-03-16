<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\quickinstall\PluginController;

Route::post('/download', [PluginController::class, 'download'])->name('extension.quickinstall.download');
Route::get('/installed', [PluginController::class, 'getInstalled'])->name('extension.quickinstall.installed');
Route::post('/remove', [PluginController::class, 'deletePlugin'])->name('extension.quickinstall.remove');

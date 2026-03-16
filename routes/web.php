<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\QuickInstall\PluginController;

Route::get('/search', [PluginController::class, 'search'])->name('extension.quickinstall.search');
Route::get('/versions', [PluginController::class, 'getVersions'])->name('extension.quickinstall.versions');
Route::post('/download', [PluginController::class, 'download'])->name('extension.quickinstall.download');
Route::get('/installed', [PluginController::class, 'getInstalled'])->name('extension.quickinstall.installed');
Route::post('/remove', [PluginController::class, 'deletePlugin'])->name('extension.quickinstall.remove');

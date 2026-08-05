// Phase 14 E2E Tests - Deployment
import { test, expect } from '@playwright/test';

test.describe('Deployment - E2E Tests', () => {
  const BASE_URL = process.env.ACCEPTANCE_BASE_URL || 'https://nexora-main-website.vercel.app';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });
  
  test('homepage loads without 404', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveStatus(200);
    await expect(page.locator('text=Nexora')).toBeVisible();
  });
  
  test('salons page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/salons`);
    await expect(page).toHaveStatus(200);
  });
  
  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveStatus(200);
    await expect(page.locator('text=Log in')).toBeVisible();
  });
  
  test('signup page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page).toHaveStatus(200);
  });
  
  test('auth callback route handles gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/callback?code=test`);
    await expect(page).toHaveStatus(200);
  });
  
  test('admin route shows unavailable', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveStatus(200);
    await expect(page.locator('text=Admin surface is restricted')).toBeVisible();
  });
  
  test('refresh preserves page', async ({ page }) => {
    await page.goto(`${BASE_URL}/salons`);
    await page.reload();
    await expect(page).toHaveStatus(200);
  });
  
  test('assets resolve', async ({ page }) => {
    await page.goto(BASE_URL);
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    // Should not have critical asset errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

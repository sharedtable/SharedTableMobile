import { Waas, Wallet, Device } from '@coinbase/waas-sdk-react-native';

class WalletService {
  /**
   * Creates a new CDP wallet for the current user.
   * This function should be called after the user is authenticated.
   */
  async createWallet(): Promise<Wallet | null> {
    try {
      // First, get the current device's details.
      // This is required to associate the wallet with the user's device.
      const device = await this.getCurrentDevice();
      if (!device) {
        throw new Error('Could not get device details for wallet creation.');
      }

      // Create the wallet using the device as a parameter.
      const wallet = await Waas.wallets.createWallet({
        device,
      });

      console.log('Wallet created successfully:', wallet);
      return wallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      // In a real application, you might want to show a user-friendly error message.
      return null;
    }
  }

  /**
   * Retrieves the wallet associated with a specific device.
   * @param device The device to look up the wallet for.
   * @returns The wallet if found, otherwise null.
   */
  async getWalletForDevice(device: Device): Promise<Wallet | null> {
    try {
      // Assuming the SDK provides a way to get a wallet by device.
      // The actual method might differ based on the SDK's API.
      // This is a placeholder for the actual implementation.
      const wallet = await Waas.wallets.getWallet({ device });
      return wallet;
    } catch (error) {
      console.error('Error getting wallet for device:', error);
      return null;
    }
  }

  /**
   * A helper function to get the current device.
   * This is a prerequisite for many wallet operations.
   */
  private async getCurrentDevice(): Promise<Device | null> {
    try {
      // The SDK should provide a method to get the current device.
      // This is a placeholder for the actual implementation.
      const device = await Waas.devices.getCurrentDevice();
      return device;
    } catch (error) {
      console.error('Error getting current device:', error);
      return null;
    }
  }
}

export const walletService = new WalletService();

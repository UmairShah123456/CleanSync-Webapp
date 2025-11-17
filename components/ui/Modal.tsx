"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, PropsWithChildren } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type ModalProps = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}>;

export function Modal({ title, open, onClose, children, footer, headerRight }: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-[0.98]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-[0.98]"
            >
              <Dialog.Panel className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#124559]/60 bg-gradient-to-br from-[#021b27] via-[#01161E] to-[#0b3141] shadow-2xl shadow-[#01161E]/80">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#598392] via-[#9AD1D4] to-transparent" />
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                  <Dialog.Title className="text-xl font-semibold text-[#EFF6E0]">
                    {title}
                  </Dialog.Title>
                  <div className="flex items-center gap-3">
                    {headerRight}
                    <button
                      type="button"
                      aria-label="Close modal"
                      onClick={onClose}
                      className="rounded-full border border-transparent bg-[#124559]/40 p-2 text-[#EFF6E0]/70 transition-colors hover:border-[#598392]/60 hover:bg-[#124559]/70 hover:text-[#EFF6E0]"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-4">
                  <div className="rounded-2xl border border-[#124559]/40 bg-[#01161E]/60 p-5 backdrop-blur-sm">
                    {children}
                  </div>
                  {footer ? (
                    <div className="mt-6 rounded-2xl border border-[#124559]/40 bg-[#01161E]/50 p-4">
                      {footer}
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

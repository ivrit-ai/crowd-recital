type Props = {
  children: React.ReactNode;
};

function CentredPage({ children }: Props) {
  return (
    <div className="flex min-h-screen-minus-topbar w-full flex-col">
      <main className="flex flex-grow">{children}</main>
    </div>
  );
}

export default CentredPage;
